// Minimal in-memory fixed-window rate limiter (no new dependency).
// State is per-process: right for the single-instance deployment this app
// targets. A multi-instance deployment would need a shared store (e.g.
// Redis), and behind a reverse proxy req.ip is the proxy's address
// unless Express "trust proxy" is configured — both are noted so the
// limits aren't mistaken for distributed protection.
export function rateLimit({ windowMs, max, message }) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Periodically drop expired windows so the map can't grow forever.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now >= entry.resetAt) hits.delete(key);
    }
  }, windowMs);
  sweep.unref?.();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    let entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res
        .status(429)
        .json({ error: message || "Too many requests, please try again later" });
    }
    next();
  };
}
