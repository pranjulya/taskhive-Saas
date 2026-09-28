import Stripe from "stripe";

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
  try {
    // Redirect targets are served by the web app: web/src/app/billing/{success,cancel}/page.tsx
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
