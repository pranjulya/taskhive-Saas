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

  it("validates role changes and protects the only owner (H3)", async () => {
    const owner = (await signup("ivan@example.com")).body;
    const member = (await signup("judy@example.com")).body;
    const team = (
      await request(app).post("/api/teams").set("Authorization", `Bearer ${owner.token}`).send({ name: "Roles" })
    ).body;
    await request(app)
      .post(`/api/teams/${team._id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ userId: member.user.id });

    const setRole = (userId, role, token = owner.token) =>
      request(app)
        .put(`/api/teams/${team._id}/members/${userId}/role`)
        .set("Authorization", `Bearer ${token}`)
        .send({ role });

    // Arbitrary role strings must not persist.
    expect((await setRole(member.user.id, "superuser")).status).toBe(400);
    // "owner" is not assignable here either.
    expect((await setRole(member.user.id, "owner")).status).toBe(400);
    // A valid change works.
    const promoted = await setRole(member.user.id, "admin");
    expect(promoted.status).toBe(200);
    expect(promoted.body.role).toBe("admin");
    // Unknown member is a 404.
    expect((await setRole("64b64c2f4f5c8a1b2c3d4e5f", "admin")).status).toBe(404);
    // The only owner cannot be demoted (the team would be locked).
    expect((await setRole(owner.user.id, "member")).status).toBe(400);
  });
});
