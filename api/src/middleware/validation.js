import { PASSWORD_CONFIG } from "../config/auth.js";

export function validateSignup(req, res, next) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < PASSWORD_CONFIG.minLength) {
    return res.status(400).json({ 
      error: `Password must be at least ${PASSWORD_CONFIG.minLength} characters long` 
    });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters long" });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  next();
}