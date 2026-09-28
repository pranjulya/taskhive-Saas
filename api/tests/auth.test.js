import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { getJwtSecret } from "../src/config/auth.js";

describe("JWT secret handling", () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it("throws a clear error when JWT_SECRET is unset (no hard-coded fallback)", () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
  });

  it("returns 500 (not a forged-token pass) from protected routes when JWT_SECRET is unset", async () => {
    const token = jwt.sign({ sub: "abc" }, "your-secret-key");
    delete process.env.JWT_SECRET;
    const res = await request(app).get("/api/teams").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
});

describe("auth middleware", () => {
  it("GET / health check responds", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, name: "TaskHive API" });
  });

  it("rejects requests without a bearer token", async () => {
    const res = await request(app).get("/api/teams");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing token" });
  });

  it("rejects tokens signed with the old fallback secret", async () => {
    const token = jwt.sign({ sub: "abc" }, "your-secret-key");
    const res = await request(app).get("/api/teams").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid token" });
  });
});
