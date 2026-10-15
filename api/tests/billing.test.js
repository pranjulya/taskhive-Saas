import request from "supertest";
import mongoose from "mongoose";
import Stripe from "stripe";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import User from "../src/models/User.js";

describe("billing (M4)", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  const signup = () =>
    request(app)
      .post("/api/auth/signup")
      .send({ name: "Bill Payer", email: "bill@example.com", password: "password123" });

  it("checkout fails loudly (500) when Stripe is not configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { body } = await signup();
    const res = await request(app)
      .post("/api/billing/checkout")
      .set("Authorization", `Bearer ${body.token}`)
      .send({});
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/STRIPE_SECRET_KEY/);
  });

  it("records the subscription on the user when checkout completes (webhook)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy";

    const { body } = await signup();
    const userId = body.user.id;

    const payload = JSON.stringify({
      id: "evt_test_1",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          object: "checkout.session",
          client_reference_id: userId,
          subscription: "sub_123",
          customer: "cus_123",
          metadata: { userId },
        },
      },
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });

    const res = await request(app)
      .post("/api/billing/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signature)
      .send(payload);
    expect(res.status).toBe(200);

    const user = await User.findById(userId);
    expect(user.subscriptionStatus).toBe("active");
    expect(user.subscriptionId).toBe("sub_123");
    expect(user.stripeCustomerId).toBe("cus_123");
  });

  it("rejects webhook calls with an invalid signature", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy";

    const res = await request(app)
      .post("/api/billing/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=1,v1=deadbeef")
      .send(JSON.stringify({ id: "evt_x", type: "checkout.session.completed", data: { object: {} } }));
    expect(res.status).toBe(400);
  });
});
