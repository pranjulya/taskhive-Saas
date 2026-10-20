import { PASSWORD_CONFIG } from "../config/auth.js";

// Pragmatic email shape: non-empty local part, one @, a domain with a
// dot, and a TLD of any length. The previous regex capped TLDs at 7
// characters and rejected valid addresses (e.g. .technology, .travel).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSignup(req, res, next) {
  const { email, password, name } = req.body ?? {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Type checks before any string method is called: a JSON body can put
  // numbers or objects in these fields. Previously a numeric password
  // sailed through the length check (undefined < 8 is false) and then
  // crashed inside bcrypt, surfacing as a 500.
  if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
    return res.status(400).json({ error: "Email, password and name must be strings" });
  }

  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < PASSWORD_CONFIG.minLength) {
    return res.status(400).json({
      error: `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters long" });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password must be strings" });
  }

  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  next();
}
