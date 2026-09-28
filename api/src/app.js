import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import teamRoutes from "./routes/team.routes.js";
import taskRoutes from "./routes/task.routes.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api", taskRoutes);

app.get("/", (_, res) => res.json({ ok: true, name: "TaskHive API" }));

// Fallback JSON error handler (e.g. missing server configuration)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
