# FixerUpper server authentication prototype

This includes server-backed sign-up and sign-in for **customer** and **technician** roles. Passwords are hashed with bcrypt; login state is held in an HTTP-only server-side session stored in SQLite. This is a prototype, not a production-ready identity platform.

## Run locally

Requires Node.js 24.x.

1. In a terminal, go to the repository folder.
2. Install dependencies: `npm install`
3. Set a private session secret and start the server:
   - macOS/Linux: `SESSION_SECRET="$(openssl rand -hex 32)" npm start`
   - PowerShell: `$env:SESSION_SECRET = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)); npm start`
4. Open `http://localhost:3000`.

The database and session files are created in `.fixerupper-data/`, which is excluded from Git. Back up and protect this directory in a real deployment.

## Simulated 2-factor-verification

After a correct password during sign-in, the prototype asks for a six-digit one-time code. The code is shown on-screen so the flow can be tested without SMS/email integration. It expires after five minutes and accepts at most five attempts. This is a **simulation only**: the code is not sent over an independent channel, so it is not genuine multi-factor authentication and must not be represented as added account protection.

## Deploy on Render

The repository includes a Render Blueprint in `render.yaml` for the whole application: the Express server serves the website and its authentication API. It pins the runtime to Node 24, sets production mode, generates a session secret in Render, and mounts persistent storage at `/var/data` for the SQLite account and session databases. The attached disk requires a paid Render web-service plan and may incur ongoing charges. Check Render's current pricing before deploying.

1. Push the repository to GitHub and sign in to Render.
2. In Render, choose **New → Blueprint**, connect this repository, and review the service plan and persistent disk before applying it.
3. Keep the generated `SESSION_SECRET` private. Render supplies the service URL; the server uses it as the HTTPS origin unless you set `PUBLIC_ORIGIN` to a custom domain.
4. After the first deploy, verify the Render service is healthy and test a new sign-up and sign-in.

The service uses a single instance because its SQLite database lives on one persistent disk. Do not remove the disk or scale this service to multiple instances without first migrating the database to a shared database service.

### Keeping accounts from an existing Railway deployment

Deploying this Blueprint creates an empty database on Render. The code changes do not transfer accounts from Railway, and no Railway data was accessed or copied. Keep the Railway service running until you have exported and verified its `users.sqlite` database on Render. Use a consistent SQLite backup while the source service is running; do not copy a live database file without its write-ahead log, and never put database files in GitHub or send them in chat. Existing sessions are tied to the old host and users should sign in again after cutover.

After the account database is securely restored to `/var/data/users.sqlite`, test sign-in before switching users to the Render URL. Set `PUBLIC_ORIGIN` in Render only if using a custom HTTPS domain. `TRUST_PROXY=1` is configured because Render terminates HTTPS at its trusted proxy.

GitHub Pages is static hosting and cannot run this Node server. For other Node-capable hosts, configure `NODE_ENV=production`, a unique `SESSION_SECRET` (at least 32 characters), a durable `FIXERUPPER_DATA_DIR`, the exact HTTPS `PUBLIC_ORIGIN`, and `TRUST_PROXY=1` only when the host's trusted reverse proxy overwrites `X-Forwarded-Proto`.

Registration allows the user to select a role for prototype purposes. It does **not** verify technician identity, licensing, or qualifications. In a real marketplace, technician approval and identity checks must be implemented separately.

The existing jobs, reviews, and message prototype features still use browser storage. Only authentication is server-backed; this does not yet make repairs, reviews, or direct messages shared or private across users.
