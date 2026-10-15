import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { createCheckoutSession, stripeWebhook } from "../controllers/billing.controller.js";

const r = Router();
r.post("/checkout", auth, createCheckoutSession);
// No auth middleware: Stripe is the caller. Authenticity is the signature
// check inside the handler.
r.post("/webhook", stripeWebhook);
export default r;
