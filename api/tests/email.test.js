import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";

describe("email identity (M8)", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  const signup = (email) =>
    request(app)
      .post("/api/auth/signup")
      .send({ name: "Case User", email, password: "password123" });

  const login = (email, password = "password123") =>
    request(app).post("/api/auth/login").send({ email, password });

  it("treats email case-insensitively across signup and login", async () => {
    expect((await signup("Mixed@Example.com")).status).toBe(201);
    expect((await login("mixed@example.com")).status).toBe(200);
    expect((await login("MIXED@EXAMPLE.COM")).status).toBe(200);
    expect((await login("  mixed@example.com  ")).status).toBe(200);
  });

  it("rejects a second signup that differs only by case", async () => {
    expect((await signup("dupe@example.com")).status).toBe(201);
    const again = await signup("DUPE@example.com");
    expect(again.status).toBe(400);
    expect(again.body.error).toBe("Email already registered");
  });

  it("returns the same generic 401 for unknown emails and wrong passwords", async () => {
    await signup("known@example.com");
    const unknown = await login("nobody@example.com");
    const wrong = await login("known@example.com", "wrong-password");
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });
});
