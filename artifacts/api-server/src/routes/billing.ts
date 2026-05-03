import { Router } from "express";
import { db } from "@workspace/db";
import { creatorProfilesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly";

router.post("/billing/create-checkout", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!process.env.STRIPE_SECRET_KEY) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const domain = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user?.email,
      customer: profile?.stripeCustomerId || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "SponsorshipOS Pro", description: "Unlimited contracts, AI invoicing, performance reports, sentiment analysis" },
            unit_amount: 2900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${domain}/app/settings/billing?success=true`,
      cancel_url: `${domain}/app/settings/billing?cancelled=true`,
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Checkout session error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/billing/portal", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!process.env.STRIPE_SECRET_KEY) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);
    if (!profile?.stripeCustomerId) {
      res.status(400).json({ error: "No Stripe customer found. Please subscribe first." });
      return;
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const domain = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost";

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${domain}/app/settings/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Portal session error");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;
