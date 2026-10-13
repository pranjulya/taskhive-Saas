import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";

describe("signup → login → teams (in-memory MongoDB)", () => {
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
      .send({ name: "Test User", email, password: "password123" });

  it("signs up and logs in with the same credentials", async () => {
    const created = await signup("alice@example.com");
    expect(created.status).toBe(201);
    expect(created.body.token).toEqual(expect.any(String));

    const loggedIn = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "password123" });
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.token).toEqual(expect.any(String));

    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "wrong-password" });
    expect(wrong.status).toBe(401);
  });

  it("GET /api/teams lists only the teams the user belongs to", async () => {
    const alice = (await signup("alice@example.com")).body.token;
    const bob = (await signup("bob@example.com")).body.token;

    const created = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${alice}`)
      .send({ name: "Alpha" });
    expect(created.status).toBe(201);

    await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${bob}`)
      .send({ name: "Bravo" });

    const res = await request(app).get("/api/teams").set("Authorization", `Bearer ${alice}`);
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.name)).toEqual(["Alpha"]);
  });

  it("lets a team member create and list tasks", async () => {
    const token = (await signup("carol@example.com")).body.token;
    const team = (
      await request(app).post("/api/teams").set("Authorization", `Bearer ${token}`).send({ name: "Tasks" })
    ).body;

    const task = await request(app)
      .post(`/api/teams/${team._id}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Write tests" });
    expect(task.status).toBe(201);

    const list = await request(app)
      .get(`/api/teams/${team._id}/tasks`)
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.map((t) => t.title)).toEqual(["Write tests"]);
  });

  it("deletes a team together with its tasks and memberships", async () => {
    const token = (await signup("dave@example.com")).body.token;
    const team = (
      await request(app).post("/api/teams").set("Authorization", `Bearer ${token}`).send({ name: "Doomed" })
    ).body;

    await request(app)
      .post(`/api/teams/${team._id}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Will be deleted too" });

    const del = await request(app)
      .delete(`/api/teams/${team._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    // Team is gone from the owner's list and no longer accessible.
    const list = await request(app).get("/api/teams").set("Authorization", `Bearer ${token}`);
    expect(list.body.map((t) => t.name)).toEqual([]);
    const get = await request(app)
      .get(`/api/teams/${team._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(403);

    // The team's tasks were deleted with it, not orphaned.
    const { default: Task } = await import("../src/models/Task.js");
    expect(await Task.countDocuments({ team: team._id })).toBe(0);
  });

  it("does not let a non-owner delete a team", async () => {
    const owner = (await signup("erin@example.com")).body.token;
    const other = (await signup("frank@example.com")).body.token;
    const team = (
      await request(app).post("/api/teams").set("Authorization", `Bearer ${owner}`).send({ name: "Keep" })
    ).body;

    const del = await request(app)
      .delete(`/api/teams/${team._id}`)
      .set("Authorization", `Bearer ${other}`);
    expect(del.status).toBe(403);
  });
});
