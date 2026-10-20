import { Router } from "express";
import { signup, login } from "../controllers/auth.controller.js";
import { validateSignup, validateLogin } from "../middleware/validation.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

// Credential endpoints get a strict budget: online password brute force
// and credential stuffing were previously unthrottled.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts, please try again later"
});

router.post("/signup", authLimiter, validateSignup, signup);
router.post("/login", authLimiter, validateLogin, login);

export default router;  