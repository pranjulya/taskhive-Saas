import request from "supertest";
import app from "../src/app.js";

describe("CORS (M9)", () => {
  it("never reflects an arbitrary origin; only the configured frontend is allowed", async () => {
    const allowed = await request(app)
      .get("/")
      .set("Origin", "http://localhost:4001");
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "http://localhost:4001"
    );

    // A different origin is never reflected back (which is what would
    // let a malicious site read responses). The header names only the
    // configured frontend, so browsers block other origins from reading.
    const other = await request(app)
      .get("/")
      .set("Origin", "https://evil.example.com");
    expect(other.headers["access-control-allow-origin"]).not.toBe(
      "https://evil.example.com"
    );
    expect(other.headers["access-control-allow-origin"]).toBe(
      "http://localhost:4001"
    );
  });
});
