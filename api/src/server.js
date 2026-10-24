import "dotenv/config";
import mongoose from "mongoose";
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

  const server = app.listen(PORT, () => {
    console.log(`🚀 TaskHive API listening on http://localhost:${PORT}`);
  });

  // Graceful shutdown: stop accepting connections, let in-flight
  // requests finish, then close the database pool — previously SIGTERM
  // just killed the process mid-request.
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down...`);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
      // Don't hang forever on a stuck connection.
      setTimeout(() => process.exit(1), 10000).unref();
    });
  }
}

start().catch((err) => {
  console.error(`❌ Failed to start TaskHive API: ${err.message}`);
  process.exit(1);
});
