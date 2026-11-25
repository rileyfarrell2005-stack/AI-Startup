# FixerUpper server authentication prototype

This includes server-backed sign-up and sign-in for **customer** and **technician** roles. Passwords are hashed with bcrypt; login state is held in an HTTP-only server-side session stored in SQLite. This is a prototype, not a production-ready identity platform.

## Run locally

Requires Node.js 20 or newer.

1. In a terminal, go to the repository folder.
2. Install dependencies: `npm install`
3. Set a private session secret and start the server:
   - macOS/Linux: `SESSION_SECRET="$(openssl rand -hex 32)" npm start`
   - PowerShell: `$env:SESSION_SECRET = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)); npm start`
4. Open `http://localhost:3000`.

The database and session files are created in `.fixerupper-data/`, which is excluded from Git. Back up and protect this directory in a real deployment.

## Simulated 2-factor-verification

After a correct password during sign-in, the prototype asks for a six-digit one-time code. The code is shown on-screen so the flow can be tested without SMS/email integration. It expires after five minutes and accepts at most five attempts. This is a **simulation only**: the code is not sent over an independent channel, so it is not genuine multi-factor authentication and must not be represented as added account protection.

## Deployment notes

GitHub Pages is static hosting and cannot run this Node server. Deploy the repository to a Node-capable host, set `NODE_ENV=production` and a unique `SESSION_SECRET` (at least 32 characters) in the host's secret manager, and set `PUBLIC_ORIGIN` to the exact HTTPS origin. Set `TRUST_PROXY=1` only when the hosting provider's trusted reverse proxy overwrites `X-Forwarded-Proto`.

Registration allows the user to select a role for prototype purposes. It does **not** verify technician identity, licensing, or qualifications. In a real marketplace, technician approval and identity checks must be implemented separately.

The existing jobs, reviews, and message prototype features still use browser storage. Only authentication is server-backed; this does not yet make repairs, reviews, or direct messages shared or private across users.
