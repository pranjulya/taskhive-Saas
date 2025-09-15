import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import teamRoutes from "./routes/team.routes.js";
// TODO: task.routes.js

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/teams", teamRoutes);

app.get("/", (_, res) => res.json({ ok: true, name: "TaskHive API" }));
export default app;
