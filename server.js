// FixerUpper authentication server.
// Passwords are bcrypt-hashed; sessions are server-side and stored in SQLite.
// Production must use HTTPS and a trusted, configured public origin.
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SESSION_SECRET = process.env.SESSION_SECRET;
const DATA_DIR = process.env.FIXERUPPER_DATA_DIR || path.join(__dirname, ".fixerupper-data");
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || "";

if (IS_PRODUCTION && (!SESSION_SECRET || SESSION_SECRET.length < 32)) {
  throw new Error("Set SESSION_SECRET to a random value at least 32 characters long in production.");
}
if (!SESSION_SECRET && !IS_PRODUCTION) {
  console.warn("Using a development-only session secret. Set SESSION_SECRET before deployment.");
}
let publicUrl = null;
if (IS_PRODUCTION) {
  try { publicUrl = new URL(PUBLIC_ORIGIN); }
  catch (error) { throw new Error("Set PUBLIC_ORIGIN to your site's full HTTPS origin, for example https://fixerupper.example.com."); }
  if (publicUrl.protocol !== "https:" || publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash || publicUrl.username || publicUrl.password) {
    throw new Error("PUBLIC_ORIGIN must be a plain HTTPS origin, such as https://fixerupper.example.com.");
  }
}
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

const db = new Database(path.join(DATA_DIR, "users.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'technician')),
    created_at TEXT NOT NULL
  )
`);
const findUserByEmail = db.prepare("SELECT id, email, password_hash, role FROM users WHERE email = ?");
const findPublicUser = db.prepare("SELECT id, email, role FROM users WHERE id = ?");
const createUser = db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)");

// Only enable this when the hosting provider's trusted reverse proxy overwrites
// X-Forwarded-Proto. Never trust arbitrary client-provided forwarding headers.
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));

// In production, always redirect HTTP and alternate hostnames to the exact
// configured HTTPS origin. The redirect destination is never built from the
// untrusted Host header, which avoids open-redirect attacks.
if (IS_PRODUCTION) {
  const canonicalHost = publicUrl.host.toLowerCase();
  app.use(function (req, res, next) {
    const requestHost = (req.get("host") || "").toLowerCase();
    if (!req.secure || requestHost !== canonicalHost) {
      return res.redirect(308, PUBLIC_ORIGIN.replace(/\/$/, "") + req.originalUrl);
    }
    next();
  });
}

app.use(express.json({ limit: "10kb", type: "application/json" }));
app.use(session({
  name: "fixerupper.sid",
  store: new SQLiteStore({ db: "sessions.sqlite", dir: DATA_DIR, table: "sessions", concurrentDB: true }),
  secret: SESSION_SECRET || crypto.randomBytes(48).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a while and try again." }
});
function csrfProtection(req, res, next) {
  const supplied = req.get("X-CSRF-Token");
  const expected = req.session && req.session.csrfToken;
  if (!supplied || !expected || supplied.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return res.status(403).json({ error: "Your session token expired. Refresh and try again." });
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Sign in required." });
  const user = findPublicUser.get(req.session.userId);
  if (!user) {
    req.session.destroy(function () {});
    return res.status(401).json({ error: "Sign in required." });
  }
  req.user = user;
  next();
}
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== role) return res.status(403).json({ error: "This action is not available for your account type." });
    next();
  };
}
function regenerateSession(req) {
  return new Promise(function (resolve, reject) {
    req.session.regenerate(function (error) { if (error) reject(error); else resolve(); });
  });
}
function saveSession(req) {
  return new Promise(function (resolve, reject) {
    req.session.save(function (error) { if (error) reject(error); else resolve(); });
  });
}
function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function validEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function validPassword(value) {
  return typeof value === "string" && value.length >= 12 && Buffer.byteLength(value, "utf8") <= 72;
}
function publicAccount(user) {
  return { id: user.id, email: user.email, role: user.role };
}

app.get("/api/auth/csrf", function (req, res, next) {
  req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  req.session.save(function (error) {
    if (error) return next(error);
    res.set("Cache-Control", "no-store").json({ csrfToken: req.session.csrfToken });
  });
});

app.post("/api/auth/register", authLimiter, csrfProtection, async function (req, res, next) {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    const password = req.body && req.body.password;
    const role = req.body && req.body.role;
    if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!validPassword(password)) return res.status(400).json({ error: "Use a password of 12–72 bytes." });
    if (role !== "customer" && role !== "technician") return res.status(400).json({ error: "Choose customer or technician." });
    const user = { id: crypto.randomUUID(), email: email, role: role };
    const hash = await bcrypt.hash(password, 12);
    try {
      createUser.run(user.id, user.email, hash, user.role, new Date().toISOString());
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Unable to create account with those details." });
      throw error;
    }
    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    await saveSession(req);
    res.status(201).set("Cache-Control", "no-store").json({ user: user, csrfToken: req.session.csrfToken });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", authLimiter, csrfProtection, async function (req, res, next) {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    const password = req.body && req.body.password;
    if (!validEmail(email) || typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    const user = findUserByEmail.get(email);
    const dummyHash = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.5JQv6cFQO2yP4uM/2Q8VJq6F9z2h7Je";
    const matches = await bcrypt.compare(password, user ? user.password_hash : dummyHash);
    if (!user || !matches) return res.status(401).json({ error: "Email or password is incorrect." });
    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    await saveSession(req);
    res.set("Cache-Control", "no-store").json({ user: publicAccount(user), csrfToken: req.session.csrfToken });
  } catch (error) { next(error); }
});

app.get("/api/auth/me", requireAuth, function (req, res) {
  res.set("Cache-Control", "no-store").json({ user: req.user });
});

app.post("/api/auth/logout", csrfProtection, function (req, res, next) {
  req.session.destroy(function (error) {
    if (error) return next(error);
    res.clearCookie("fixerupper.sid", { httpOnly: true, secure: IS_PRODUCTION, sameSite: "lax" });
    res.status(204).end();
  });
});

app.get("/api/customer/account", requireAuth, requireRole("customer"), function (req, res) {
  res.json({ user: req.user });
});
app.get("/api/technician/account", requireAuth, requireRole("technician"), function (req, res) {
  res.json({ user: req.user });
});

app.use(function (req, res, next) {
  if (/^\/(?:\.fixerupper-data|server\.js|package(?:-lock)?\.json|\.git)(?:\/|$)/i.test(req.path)) return res.sendStatus(404);
  if (req.path === "/index.html") return res.redirect(302, "/");
  next();
});
app.get("/", function (req, res, next) {
  fs.readFile(path.join(__dirname, "index.html"), "utf8", function (error, html) {
    if (error) return next(error);
    const injectedHead = '<link rel="stylesheet" href="/auth.css">';
    const injectedBody = '<script src="/auth-client.js" defer></script>';
    html = html.replace(/<body([^>]*)>/i, '<body class="auth-locked"$1>');
    html = html.replace(/<\/head>/i, injectedHead + "</head>");
    html = html.replace(/<\/body>/i, injectedBody + "</body>");
    res.set("Cache-Control", "no-store").type("html").send(html);
  });
});
app.use(express.static(__dirname, { dotfiles: "deny", index: false, maxAge: IS_PRODUCTION ? "1h" : 0 }));
app.use(function (error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  if (req.path.startsWith("/api/")) return res.status(500).json({ error: "A server error occurred." });
  res.status(500).send("A server error occurred.");
});

app.listen(PORT, function () {
  console.log("FixerUpper auth server listening on port " + PORT);
});
