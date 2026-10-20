import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";

describe("request validation (L2)", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("rejects a numeric password with 400, not a 500 crash", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Val User", email: "val@example.com", password: 12345678 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must be strings/);
  });

  it("rejects non-string fields on login too", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "val@example.com", password: 12345678 });
    expect(res.status).toBe(400);
  });

  it("accepts valid emails with long TLDs", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Long Tld", email: "long@example.technology", password: "password123" });
    expect(res.status).toBe(201);
  });
});
