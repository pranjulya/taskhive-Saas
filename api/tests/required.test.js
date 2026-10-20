import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";

describe("schema required fields (L5)", () => {
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

  it("a team without a name and a task without a title are not stored", async () => {
    const { body } = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Req User", email: "req@example.com", password: "password123" });
    const auth = { Authorization: `Bearer ${body.token}` };

    const teamRes = await request(app).post("/api/teams").set(auth).send({});
    expect(teamRes.status).toBeGreaterThanOrEqual(400);

    const team = (
      await request(app).post("/api/teams").set(auth).send({ name: "Real" })
    ).body;
    const taskRes = await request(app)
      .post(`/api/teams/${team._id}/tasks`)
      .set(auth)
      .send({ description: "no title here" });
    expect(taskRes.status).toBeGreaterThanOrEqual(400);

    const tasks = await request(app).get(`/api/teams/${team._id}/tasks`).set(auth);
    expect(tasks.body).toHaveLength(0);
  });
});
