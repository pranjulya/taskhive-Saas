import Stripe from "stripe";
import User from "../models/User.js";

let stripeClient;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export async function createCheckoutSession(req, res) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured (set STRIPE_SECRET_KEY)" });
  }
  // Fail loudly on missing config instead of building malformed redirect
  // URLs ("undefined/billing/success...") or leaking Stripe's raw error.
  if (!process.env.STRIPE_PRICE_PRO) {
    return res.status(500).json({ error: "Stripe price is not configured (set STRIPE_PRICE_PRO)" });
  }
  if (!process.env.FRONTEND_URL) {
    return res.status(500).json({ error: "FRONTEND_URL is not configured" });
  }
  try {
    const user = await User.findById(req.userId).select("email");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
      // Redirect targets are served by the web app: web/src/app/billing/{success,cancel}/page.tsx
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
      // Attribution: without these, a completed payment cannot be tied
      // back to a TaskHive account at all. The webhook reads
      // client_reference_id from the checkout event, and the subscription
      // metadata carries the user id into later subscription events
      // (which have no checkout reference).
      client_reference_id: req.userId,
      ...(user?.email ? { customer_email: user.email } : {}),
      metadata: { userId: req.userId },
      subscription_data: { metadata: { userId: req.userId } },
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout session creation failed:", e.message);
    res.status(502).json({ error: "Billing provider error" });
  }
}

function mapSubscriptionStatus(stripeStatus) {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "past_due";
  return "canceled";
}

// Stripe calls this endpoint, not a logged-in user, so there is no auth
// middleware: authenticity comes from verifying the Stripe signature over
// the raw request body (mounted as express.raw in app.js).
export async function stripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Stripe webhook is not configured" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.error("Stripe webhook signature verification failed:", e.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    const obj = event.data.object;
    const userId = obj.client_reference_id || obj.metadata?.userId || null;

    if (userId) {
      if (event.type === "checkout.session.completed") {
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: "active",
          subscriptionId: obj.subscription,
          stripeCustomerId: obj.customer,
        });
      } else if (event.type === "customer.subscription.updated") {
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: mapSubscriptionStatus(obj.status),
          subscriptionId: obj.id,
          stripeCustomerId: obj.customer,
        });
      } else if (event.type === "customer.subscription.deleted") {
        await User.findByIdAndUpdate(userId, { subscriptionStatus: "canceled" });
      }
    }
  } catch (e) {
    console.error("Stripe webhook handling failed:", e.message);
    return res.status(500).json({ error: "Webhook handling failed" });
  }

  res.json({ received: true });
}
