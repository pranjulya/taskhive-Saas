import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";

describe("rate limiting (M6)", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("throttles repeated login attempts with 429 + Retry-After", async () => {
    const attempt = () =>
      request(app)
        .post("/api/auth/login")
        .send({ email: "rl@example.com", password: "wrong-password" });

    // The credential budget is 20 per 15 minutes per IP: the first 20
    // attempts pass the limiter (and fail auth with 401).
    for (let i = 0; i < 20; i++) {
      const res = await attempt();
      expect(res.status).toBe(401);
    }
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("does not throttle normal API reads at credential-endpoint rates", async () => {
    // The global ceiling (300/15min) is far above test traffic; a handful
    // of unauthenticated reads still get the normal 401, never a 429.
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get("/api/teams");
      expect(res.status).toBe(401);
    }
  });
});
