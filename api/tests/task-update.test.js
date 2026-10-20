import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";

describe("task update semantics (L6)", () => {
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

  async function setup() {
    const owner = (
      await request(app)
        .post("/api/auth/signup")
        .send({ name: "Owner", email: "o@example.com", password: "password123" })
    ).body;
    const member = (
      await request(app)
        .post("/api/auth/signup")
        .send({ name: "Member", email: "m@example.com", password: "password123" })
    ).body;
    const team = (
      await request(app)
        .post("/api/teams")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ name: "T" })
    ).body;
    await request(app)
      .post(`/api/teams/${team._id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ userId: member.user.id });
    return { owner, member, team };
  }

  it("rejects assigning a task to a non-member", async () => {
    const { owner, team } = await setup();
    const res = await request(app)
      .post(`/api/teams/${team._id}/tasks`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "X", assignee: "64b64c2f4f5c8a1b2c3d4e5f" });
    expect(res.status).toBe(400);
  });

  it("can clear an assignee and a due date with explicit null", async () => {
    const { owner, member, team } = await setup();
    const auth = { Authorization: `Bearer ${owner.token}` };
    const task = (
      await request(app)
        .post(`/api/teams/${team._id}/tasks`)
        .set(auth)
        .send({ title: "Y", assignee: member.user.id, dueDate: "2030-01-01" })
    ).body;
    expect(task.assignee).toBe(member.user.id);

    const cleared = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set(auth)
      .send({ assignee: null, dueDate: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.assignee).toBeNull();
    expect(cleared.body.dueDate).toBeNull();
  });
});
