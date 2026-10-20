import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getJwtSecret, JWT_CONFIG } from "../config/auth.js";

// Email is the account identity: it is stored and looked up trimmed and
// lowercased (the schema also enforces this), so "User@x.com" and
// "user@x.com" are one account, not two.
function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

// A real bcrypt hash of a placeholder password. Login compares against
// this when the account doesn't exist, so the response takes the same
// time as a genuine password check and doesn't reveal, via timing,
// whether an email is registered.
const DUMMY_PASSWORD_HASH = "$2a$10$q8Q6w.wr/4rXdKkr0O3mD.U5PAXNpEbOgWKjgircZROB9Hg0HB4ba";

// The user id is stored in the standard `sub` claim; middleware/auth.js reads the same claim.
function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, getJwtSecret(), {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: JWT_CONFIG.algorithm
  });
}

// User registration
export async function signup(req, res) {
  try {
    const { password, name } = req.body;
    const email = normalizeEmail(req.body.email);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create new user (the model stores a bcrypt hash in `passwordHash`)
    const user = new User({ email, name });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// User login
export async function login(req, res) {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      // Spend the same bcrypt time as a real attempt (see DUMMY_PASSWORD_HASH).
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
