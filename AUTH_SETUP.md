# FixerUpper server authentication prototype

This adds server-backed sign-up and sign-in for **customer** and **technician** roles. Passwords are hashed with bcrypt; login state is held in an HTTP-only server-side session stored in SQLite. The front end does not save passwords or session tokens in localStorage.

## Run locally

Requires Node.js 20 or newer.

1. In a terminal, go to the repository folder.
2. Install dependencies: `npm install`
3. Set a private session secret and start the server:
   - macOS/Linux: `SESSION_SECRET="$(openssl rand -hex 32)" npm start`
   - PowerShell: `$env:SESSION_SECRET = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)); npm start`
4. Open `http://localhost:3000`.

The database and session files are created in `.fixerupper-data/`, which is excluded from Git. Back up and protect this directory in a real deployment.

## Deployment notes

GitHub Pages is static hosting and cannot run this Node server. Deploy the repository to a Node-capable host, set `NODE_ENV=production` and a unique `SESSION_SECRET` (at least 32 characters) in the host's secret manager, and use HTTPS. If the host is behind one trusted reverse proxy, set `TRUST_PROXY=1`. Keep `.fixerupper-data/` on persistent private storage. Do not commit secrets or database files.

Registration allows the user to select a role for prototype purposes. It does **not** verify technician identity, licensing, or qualifications. In a real marketplace, technician approval and identity checks must be implemented before trusting the role.

The existing jobs, reviews, and message prototype features still use browser storage. Only authentication is server-backed; this does not yet make repairs, reviews, or direct messages shared or private. Every future data API must use `requireAuth` and the appropriate `requireRole` middleware in `server.js`, and should enforce job ownership server-side. Do not use client-side hiding as authorization.
