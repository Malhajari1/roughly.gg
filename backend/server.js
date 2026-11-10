// Roughly backend: answer stats + optional email-code sign-in + progress sync.
// Zero dependencies. Needs Node 18+. Run:  node server.js
// Env: PORT (8787), DATA_DIR (./data), ORIGIN (* by default), DEV=1 (returns sign-in codes in the response, never use in production),
//      RESEND_API_KEY + MAIL_FROM (to email sign-in codes via resend.com)
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const PORT = +process.env.PORT || 8787, DIR = process.env.DATA_DIR || path.join(__dirname, "data"), ORIGIN = process.env.ORIGIN || "*", DEV = process.env.DEV === "1";
const FILE = path.join(DIR, "db.json");
fs.mkdirSync(DIR, { recursive: true });
let db = { answers: {}, accounts: {}, tokens: {}, codes: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(FILE, "utf8"))); } catch (e) {}
let dirty = false;
function persist() { dirty = true; }
setInterval(() => { if (!dirty) return; dirty = false; const t = FILE + ".tmp"; fs.writeFileSync(t, JSON.stringify(db)); fs.renameSync(t, FILE); }, 1000).unref();
process.on("SIGINT", () => { if (dirty) fs.writeFileSync(FILE, JSON.stringify(db)); process.exit(0); });
process.on("SIGTERM", () => { if (dirty) fs.writeFileSync(FILE, JSON.stringify(db)); process.exit(0); });

const hits = {};
function limited(ip, max) { const m = Math.floor(Date.now() / 60000), k = ip + ":" + m; hits[k] = (hits[k] || 0) + 1; if (Math.random() < 0.01) for (const x in hits) if (!x.endsWith(":" + m)) delete hits[x]; return hits[k] > max; }
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");
const isInt = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;

function send(res, code, obj) { res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": ORIGIN, "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS" }); res.end(JSON.stringify(obj)); }
function body(req) { return new Promise((ok, no) => { let b = ""; req.on("data", (c) => { b += c; if (b.length > 20000) { no(new Error("Too large")); req.destroy(); } }); req.on("end", () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { no(new Error("Bad JSON")); } }); }); }
function authed(req) { const m = /^Bearer ([a-f0-9]{48})$/.exec(req.headers.authorization || ""); if (!m) return null; const t = db.tokens[sha(m[1])]; if (!t || t.exp < Date.now()) return null; return t.email; }

// stats for one day: per-question distributions (20 bands of 5 points) and the distribution of 3-question averages
function band(s) { return Math.min(19, Math.floor(s / 5)); }
function stats(day) {
  const d = db.answers[day] || {}, q = {}, avg = { n: 0, dist: Array(20).fill(0) };
  for (const p in d) {
    const a = d[p], ks = Object.keys(a);
    for (const qi of ks) { const o = (q[qi] = q[qi] || { n: 0, over: 0, under: 0, dist: Array(20).fill(0), rs: [] }); o.n++; o.dist[band(a[qi].s)]++; if (o.rs.length < 5000) o.rs.push(Math.round(a[qi].r * 100) / 100); if (a[qi].r > 0.0212) o.over++; else if (a[qi].r < -0.0212) o.under++; }
    if (ks.length === 3) { avg.n++; avg.dist[band(Math.round(ks.reduce((t, k) => t + a[k].s, 0) / 3))]++; }
  }
  return { day, q, avg };
}
const cache = {};
function cachedStats(day) { const c = cache[day]; if (c && Date.now() - c.t < 3000) return c.v; const v = stats(day); cache[day] = { t: Date.now(), v }; return v; }

async function sendMail(to, code) {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "Roughly <onboarding@resend.dev>", to: [to], subject: "Your Roughly code: " + code, text: "Your Roughly sign-in code is " + code + ". It expires in 10 minutes. If you didn't ask for it, ignore this email." }) });
    if (!r.ok) throw new Error("mail");
    return null;
  }
  if (DEV) { console.log("[dev] sign-in code for " + to + ": " + code); return code; }
  throw new Error("nomail");
}

const routes = {
  "GET /health": async () => [200, { ok: true }],
  "POST /answer": async (req, res, b) => {
    if (!/^[a-f0-9]{24}$/.test(b.pid || "") || !isInt(b.day, 20000, 30000) || !isInt(b.qi, 0, 500) || !isInt(b.s, 1, 100) || typeof b.r !== "number" || !isFinite(b.r) || Math.abs(b.r) > 15) return [400, { error: "Invalid answer" }];
    const d = (db.answers[b.day] = db.answers[b.day] || {}), a = (d[b.pid] = d[b.pid] || {});
    if (!a[b.qi] && Object.keys(a).length >= 3) return [400, { error: "Too many answers" }];
    a[b.qi] = { r: Math.round(b.r * 1000) / 1000, s: b.s }; delete cache[b.day]; persist();
    return [200, { ok: true }];
  },
  "GET /stats": async (req, res, b, url) => { const day = +url.searchParams.get("day"); if (!isInt(day, 20000, 30000)) return [400, { error: "Invalid day" }]; return [200, cachedStats(day)]; },
  "POST /auth/start": async (req, res, b, url, ip) => {
    const email = String(b.email || "").trim().toLowerCase();
    if (!/^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$/.test(email)) return [400, { error: "That email doesn’t look right" }];
    const c = db.codes[email];
    if (c && Date.now() - c.at < 30000) return [429, { error: "Please wait 30 seconds before asking for another code" }];
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    let dev; try { dev = await sendMail(email, code); } catch (e) { return [503, { error: e.message === "nomail" ? "Email isn’t set up on the server yet" : "Couldn’t send the email" }]; }
    db.codes[email] = { h: sha(email + code), at: Date.now(), exp: Date.now() + 600000, tries: 0 }; persist();
    return [200, dev ? { ok: true, devCode: dev } : { ok: true }];
  },
  "POST /auth/verify": async (req, res, b) => {
    const email = String(b.email || "").trim().toLowerCase(), code = String(b.code || ""), c = db.codes[email];
    if (!c || c.exp < Date.now() || c.tries >= 5) return [400, { error: "That code has expired. Ask for a new one" }];
    c.tries++;
    if (!/^\d{6}$/.test(code) || c.h !== sha(email + code)) { persist(); return [400, { error: "That code isn’t right" }]; }
    delete db.codes[email];
    const tok = crypto.randomBytes(24).toString("hex");
    db.tokens[sha(tok)] = { email, exp: Date.now() + 90 * 864e5 };
    db.accounts[email] = db.accounts[email] || { days: {} }; persist();
    return [200, { token: tok }];
  },
  "GET /sync": async (req) => { const e = authed(req); if (!e) return [401, { error: "Sign in again" }]; return [200, { days: (db.accounts[e] || { days: {} }).days }]; },
  "PUT /sync": async (req, res, b) => {
    const e = authed(req); if (!e) return [401, { error: "Sign in again" }];
    const acc = (db.accounts[e] = db.accounts[e] || { days: {} });
    for (const k of Object.keys(b.days || {}).slice(0, 400)) {
      const d = +k, p = b.days[k];
      if (!isInt(d, 20000, 30000) || !p || !Array.isArray(p.g) || !Array.isArray(p.s) || !Array.isArray(p.ids) || p.ids.length !== 3 || p.g.length !== p.s.length || p.g.length > 3) continue;
      if (!p.ids.every((i) => isInt(i, 0, 500)) || !p.g.every((x) => typeof x === "number" && x > 0 && x < 1e15) || !p.s.every((x) => isInt(x, 1, 100))) continue;
      const old = acc.days[d]; if (old && old.g.length >= p.g.length) continue;
      acc.days[d] = { ids: p.ids, g: p.g, s: p.s, un: (Array.isArray(p.un) ? p.un : []).slice(0, 3).map((x) => String(x).slice(0, 12)), hu: [0, 1].includes(p.hu && p.hu[0]) ? p.hu.slice(0, 3).map((x) => (x ? 1 : 0)) : [0, 0, 0], pd: isInt(p.pd, 0, 30000) ? p.pd : 0 };
    }
    persist(); return [200, { ok: true }];
  },
};

http.createServer(async (req, res) => {
  const ip = req.socket.remoteAddress || "x", url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (limited(ip, 1500)) return send(res, 429, { error: "Slow down" });
  const h = routes[req.method + " " + url.pathname];
  if (!h) return send(res, 404, { error: "Not found" });
  try { const b = req.method === "GET" ? {} : await body(req); const [c, o] = await h(req, res, b, url, ip); send(res, c, o); }
  catch (e) { send(res, 400, { error: e.message || "Bad request" }); }
}).listen(PORT, () => console.log("Roughly backend on :" + PORT + (DEV ? " (DEV mode)" : "")));
