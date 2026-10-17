import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";

describe("error contract (M5)", () => {
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

  const signup = () =>
    request(app)
      .post("/api/auth/signup")
      .send({ name: "Err Case", email: "err@example.com", password: "password123" });

  it("malformed ids return 400 { error: 'Invalid id' }, not leaked internals", async () => {
    const { body } = await signup();
    const teamRes = await request(app)
      .get("/api/teams/not-an-object-id")
      .set("Authorization", `Bearer ${body.token}`);
    expect(teamRes.status).toBe(400);
    expect(teamRes.body).toEqual({ error: "Invalid id" });

    const taskRes = await request(app)
      .get("/api/tasks/not-an-object-id")
      .set("Authorization", `Bearer ${body.token}`);
    expect(taskRes.status).toBe(400);
    expect(taskRes.body).toEqual({ error: "Invalid id" });
  });

  it("task errors use { error } with a meaningful status (invalid status → 400)", async () => {
    const { body } = await signup();
    const team = (
      await request(app)
        .post("/api/teams")
        .set("Authorization", `Bearer ${body.token}`)
        .send({ name: "ErrTeam" })
    ).body;

    const res = await request(app)
      .post(`/api/teams/${team._id}/tasks`)
      .set("Authorization", `Bearer ${body.token}`)
      .send({ title: "Bad status", status: "bogus" });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe("string");
    expect(res.body.message).toBeUndefined();
  });

  it("task authorization failures use the shared { error } shape", async () => {
    const { body } = await signup();
    const res = await request(app)
      .get("/api/teams/64b64c2f4f5c8a1b2c3d4e5f/tasks")
      .set("Authorization", `Bearer ${body.token}`);
    // Team doesn't exist: still a clean error body, whatever the status.
    expect([403, 404]).toContain(res.status);
    expect(typeof res.body.error).toBe("string");
    expect(res.body.message).toBeUndefined();
  });
});
