import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret, JWT_CONFIG } from "../config/auth.js";

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
    const { email, password, name } = req.body;

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
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
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
