import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { createCheckoutSession } from "../controllers/billing.controller.js";

const r = Router();
r.post("/checkout", auth, createCheckoutSession);
export default r;
