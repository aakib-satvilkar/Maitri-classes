# Maitri Classes

React + Vite + Tailwind frontend with a tiny zero-dependency Node server (`server/server.js`).

**Data is permanent.** Students, tasks, notices, staff, common homework, grammar scores and uploaded PDFs/images are stored on the server (`DATA_DIR/state.json` and `DATA_DIR/uploads/`). Nothing expires — a student or file is removed only when the admin deletes it. Everything is shared across all devices (parents see what the admin posts).

## Run locally
```
npm install
npm start          # terminal 1 — server on :3000 (data in ./data)
npm run dev        # terminal 2 — frontend on :5173 (proxies /api to :3000)
```
Or production-style: `npm run build && npm start` → http://localhost:3000

## Deploy (Docker — any host with a persistent disk)
The app needs **one persistent disk/volume mounted at `/data`**. Without it, redeploys wipe data.

- **Render**: push to GitHub → New → Blueprint (uses `render.yaml`) → set `ADMIN_PASSWORD`. Persistent disks need a paid instance.
- **Railway / Fly.io / any VPS**: deploy the `Dockerfile`, attach a volume at `/data`, set `ADMIN_PASSWORD`.
- **VPS without Docker**: `npm ci && npm run build && ADMIN_PASSWORD=... DATA_DIR=/var/maitri PORT=3000 node server/server.js` (put Nginx/Caddy in front for HTTPS).

Environment variables: `ADMIN_PASSWORD` (first-run password; change later in Admin → Settings), `DATA_DIR` (default `./data`, `/data` in Docker), `PORT`, `SESSION_SECRET` (optional).

## Backups
Copy the whole `DATA_DIR` folder (state.json + uploads/). A `state.backup.json` is also refreshed hourly.

## Security notes
- Admin password is hashed on the server; admin API calls need a signed login token (12 h); login attempts are rate-limited.
- Uploads are limited to PDF/PNG/JPG/WEBP/GIF, max 5 MB (UI limit 4 MB), and only admins can upload.
- Uploaded files that are no longer used by any record are cleaned up after 1 hour (i.e. only after the admin deleted them).
- Known limits: the parent portal still lists all students (no per-parent login yet), and staff "Acting as" is an in-app permission switch, not separate logins.
