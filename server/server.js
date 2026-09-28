/* Maitri Classes — zero-dependency Node server.
   - Serves the built React app (dist/)
   - Stores ALL data in DATA_DIR/state.json and uploaded files in DATA_DIR/uploads
   - Nothing is ever removed automatically: students, tasks and files stay until the admin deletes them.
   Env: PORT (3000), DATA_DIR (./data), ADMIN_PASSWORD (first-run password), SESSION_SECRET (optional) */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, "..", "data"));
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const DIST_DIR = path.join(__dirname, "..", "dist");
const MAX_UPLOAD = 5 * 1024 * 1024; // 5 MB
const MAX_JSON = 2 * 1024 * 1024;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------- persistence ---------- */
const ADMIN_KEYS = ["tasksByClass", "notices", "staff", "groupLinksByClass", "dailyTask", "commonHomework", "students"];

function hashPw(pw, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(pw), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}
function checkPw(pw, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = crypto.scryptSync(String(pw), salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

let state = {};
try { state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { state = {}; }
if (!state.adminHash) {
  const initial = process.env.ADMIN_PASSWORD || "shad123";
  if (!process.env.ADMIN_PASSWORD) console.warn("WARNING: ADMIN_PASSWORD not set — using default 'shad123'. Set it and/or change it in Admin → Settings.");
  state.adminHash = hashPw(initial);
}
if (!state.secret) state.secret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
if (!state.grammarScores) state.grammarScores = {};

function persist() {
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, STATE_FILE); // atomic
  // rolling backup, at most once per hour
  try {
    const bak = path.join(DATA_DIR, "state.backup.json");
    if (!fs.existsSync(bak) || Date.now() - fs.statSync(bak).mtimeMs > 3600e3) fs.copyFileSync(STATE_FILE, bak);
  } catch { /* ignore */ }
}
persist();

/* ---------- auth (signed, expiring tokens) ---------- */
function sign(payload) {
  return crypto.createHmac("sha256", state.secret).update(payload).digest("base64url");
}
function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 12 * 3600e3 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function isAdmin(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const good = sign(payload);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); } catch { return false; }
}

const failures = new Map(); // ip -> { n, until }
function throttled(ip) { const f = failures.get(ip); return f && f.until > Date.now() && f.n >= 8; }
function noteFailure(ip) {
  const f = failures.get(ip);
  const n = f && f.until > Date.now() ? f.n + 1 : 1;
  failures.set(ip, { n, until: Date.now() + 10 * 60e3 });
}

/* ---------- helpers ---------- */
function send(res, code, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  res.writeHead(code, { "Content-Type": isBuf ? "application/octet-stream" : "application/json", "Cache-Control": "no-store", ...headers });
  res.end(isBuf ? body : JSON.stringify(body));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error("Too large"), { code: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
async function readJson(req) {
  const buf = await readBody(req, MAX_JSON);
  try { return JSON.parse(buf.toString() || "{}"); } catch { throw Object.assign(new Error("Bad JSON"), { code: 400 }); }
}
function publicState(admin) {
  const out = { grammarScores: state.grammarScores };
  for (const k of ADMIN_KEYS) if (k in state) out[k] = state[k];
  if (!admin) delete out.staff; // staff passwords never leave the server for non-admins
  return out;
}
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".pdf": "application/pdf", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const UPLOAD_TYPES = { "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" };

function referencedUploads() {
  const found = new Set();
  const re = /\/uploads\/([a-f0-9]{32}\.[a-z]+)/g;
  let m; const s = JSON.stringify(state);
  while ((m = re.exec(s))) found.add(m[1]);
  return found;
}
/* Delete a file ONLY when it is no longer referenced by any record (i.e. admin deleted it)
   and it is older than 1 hour (so a file just uploaded but not yet posted is safe). */
function collectGarbage() {
  const used = referencedUploads();
  for (const f of fs.readdirSync(UPLOAD_DIR)) {
    if (used.has(f)) continue;
    const p = path.join(UPLOAD_DIR, f);
    try { if (Date.now() - fs.statSync(p).mtimeMs > 3600e3) fs.unlinkSync(p); } catch { /* ignore */ }
  }
}
setInterval(() => { try { collectGarbage(); } catch { /* ignore */ } }, 3600e3).unref();

/* ---------- routes ---------- */
async function handleApi(req, res, url) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "";

  if (req.method === "GET" && url.pathname === "/api/state") {
    return send(res, 200, publicState(isAdmin(req)));
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    if (throttled(ip)) return send(res, 429, { error: "Too many attempts. Try again in a few minutes." });
    const { password } = await readJson(req);
    if (checkPw(password, state.adminHash)) { failures.delete(ip); return send(res, 200, { token: makeToken() }); }
    noteFailure(ip);
    return send(res, 401, { error: "Incorrect password" });
  }

  if (req.method === "POST" && url.pathname === "/api/grammar-score") {
    const { childId, topicId, score } = await readJson(req);
    if (typeof childId !== "string" || typeof topicId !== "string" || !Number.isFinite(score) || childId.length > 60 || topicId.length > 60) return send(res, 400, { error: "Bad input" });
    const child = state.grammarScores[childId] || {};
    const prev = child[topicId] || { best: 0, attempts: 0 };
    child[topicId] = { best: Math.max(prev.best, score), attempts: prev.attempts + 1 };
    state.grammarScores[childId] = child;
    persist();
    return send(res, 200, { ok: true, grammarScores: state.grammarScores });
  }

  // ---- everything below needs admin ----
  if (!isAdmin(req)) return send(res, 401, { error: "Admin login required" });

  if (req.method === "PUT" && url.pathname === "/api/state") {
    const body = await readJson(req);
    for (const k of ADMIN_KEYS) if (k in body) state[k] = body[k];
    persist();
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/password") {
    const { current, next } = await readJson(req);
    if (!checkPw(current, state.adminHash)) return send(res, 400, { error: "Current password is incorrect." });
    if (typeof next !== "string" || next.length < 6) return send(res, 400, { error: "New password must be at least 6 characters." });
    state.adminHash = hashPw(next);
    persist();
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/upload") {
    const type = String(req.headers["content-type"] || "").split(";")[0];
    const ext = UPLOAD_TYPES[type];
    if (!ext) return send(res, 415, { error: "Only PDF or image files are supported." });
    const buf = await readBody(req, MAX_UPLOAD);
    if (!buf.length) return send(res, 400, { error: "Empty file" });
    const id = crypto.randomBytes(16).toString("hex") + ext;
    fs.writeFileSync(path.join(UPLOAD_DIR, id), buf);
    return send(res, 200, { url: `/uploads/${id}`, size: buf.length });
  }

  return send(res, 404, { error: "Not found" });
}

function serveFile(res, file, extra = {}) {
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", ...extra });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/healthz") return send(res, 200, { ok: true });
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);

    if (url.pathname.startsWith("/uploads/")) {
      const name = path.basename(url.pathname);
      const file = path.join(UPLOAD_DIR, name);
      if (!/^[a-f0-9]{32}\.[a-z]+$/.test(name) || !fs.existsSync(file)) return send(res, 404, { error: "Not found" });
      return serveFile(res, file, { "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
    }

    // static React build with SPA fallback
    let file = path.join(DIST_DIR, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ""));
    if (!file.startsWith(DIST_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST_DIR, "index.html");
    if (!fs.existsSync(file)) return send(res, 503, { error: "App not built. Run: npm run build" });
    const cache = file.includes(`${path.sep}assets${path.sep}`) ? "public, max-age=31536000, immutable" : "no-cache";
    return serveFile(res, file, { "Cache-Control": cache });
  } catch (err) {
    const code = err.code === 413 ? 413 : err.code === 400 ? 400 : 500;
    if (code === 500) console.error(err);
    if (!res.headersSent) send(res, code, { error: code === 413 ? "File too large" : code === 400 ? "Bad request" : "Server error" });
  }
});

server.listen(PORT, () => console.log(`Maitri Classes running on :${PORT} (data: ${DATA_DIR})`));
