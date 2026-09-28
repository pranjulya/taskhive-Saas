import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { getJwtSecret } from "./config/auth.js";

const PORT = Number(process.env.PORT) || 8080;

async function start() {
  // Fail fast with a clear message instead of starting a half-working API.
  getJwtSecret();
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set. Add it to api/.env (see api/.env.example).");
  }

  await connectDB(process.env.MONGO_URI);

  app.listen(PORT, () => {
    console.log(`🚀 TaskHive API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(`❌ Failed to start TaskHive API: ${err.message}`);
  process.exit(1);
});
