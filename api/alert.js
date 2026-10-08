// Project Vault demo: alert relay (POST = field phone, GET = desk, DELETE = reset)
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const LIST = "vault:alerts";
const mem = []; // fallback only; not shared across serverless instances

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
}

const num = (v, lim) => (Number.isFinite(+v) && Math.abs(+v) <= lim ? +v : null);
const clean = (b) => ({
  id: Number(b.id) || Date.now(),
  t: String(b.t || "").slice(0, 20),
  place: String(b.place || "").slice(0, 80),
  lat: num(b.lat, 90),
  lng: num(b.lng, 180),
  offline: !!b.offline,
  who: String(b.who || "Journalist").slice(0, 40),
});

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const need = process.env.VAULT_KEY;
  if (need && req.headers["x-vault-key"] !== need) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const useRedis = !!(URL_ && TOKEN);
  try {
    if (req.method === "POST") {
      const a = clean(req.body || {});
      if (useRedis) {
        await redis(["LPUSH", LIST, JSON.stringify(a)]);
        await redis(["LTRIM", LIST, "0", "49"]);
        await redis(["EXPIRE", LIST, "86400"]);
      } else {
        mem.unshift(a);
        mem.length = Math.min(mem.length, 50);
      }
      return res.status(201).json({ ok: true, id: a.id });
    }
    if (req.method === "GET") {
      const since = Number(req.query.since) || 0;
      const list = useRedis ? (await redis(["LRANGE", LIST, "0", "19"])).map((s) => JSON.parse(s)) : mem;
      return res.status(200).json({ alerts: list.filter((a) => a.id > since), storage: useRedis ? "redis" : "memory" });
    }
    if (req.method === "DELETE") {
      if (useRedis) await redis(["DEL", LIST]);
      else mem.length = 0;
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: "server error" });
  }
};
