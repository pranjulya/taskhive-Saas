import jwt from "jsonwebtoken";
import { getJwtSecret, JWT_CONFIG } from "../config/auth.js";

export function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  let secret;
  try {
    secret = getJwtSecret();
  } catch (err) {
    return next(err);
  }

  try {
    const payload = jwt.verify(token, secret, { algorithms: [JWT_CONFIG.algorithm] });
    if (!payload.sub) return res.status(401).json({ error: "Invalid token" });
    // Team controllers read req.userId; task controllers read req.user.id.
    req.userId = payload.sub;
    req.user = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
