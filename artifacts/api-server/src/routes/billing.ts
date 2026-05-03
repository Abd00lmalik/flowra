import { Router } from "express";
import { db } from "@workspace/db";
import { creatorProfilesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";
import crypto from "crypto";

const router = Router();

router.post("/billing/create-checkout", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!process.env.PAYSTACK_SECRET_KEY) {
      res.status(503).json({ error: "Paystack not configured. Add PAYSTACK_SECRET_KEY." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user?.email) {
      res.status(400).json({ error: "User email required" });
      return;
    }

    const domain = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost";
    const reference = `flowra_sub_${userId}_${Date.now()}`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: 290000,
        reference,
        callback_url: `${domain}/app/settings/billing?success=true`,
        metadata: {
          userId,
          plan: "pro",
          cancel_action: `${domain}/app/settings/billing?cancelled=true`,
        },
        ...(process.env.PAYSTACK_PRO_PLAN_CODE ? { plan: process.env.PAYSTACK_PRO_PLAN_CODE } : {}),
      }),
    });

    const data = await response.json() as any;
    if (!data.status) throw new Error(data.message || "Paystack initialization failed");

    res.json({ url: data.data.authorization_url });
  } catch (err) {
    logger.error({ err }, "Paystack checkout error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/billing/portal", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);

    if (!profile?.paystackCustomerId) {
      res.status(400).json({ error: "No Paystack customer found. Please subscribe first." });
      return;
    }

    const domain = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost";
    res.json({ url: `${domain}/app/settings/billing` });
  } catch (err) {
    logger.error({ err }, "Portal error");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/webhooks/paystack", async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) { res.status(400).send("Paystack not configured"); return; }

    const sig = req.headers["x-paystack-signature"] as string;
    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");

    if (hash !== sig) {
      res.status(400).send("Invalid webhook signature");
      return;
    }

    const event = req.body;
    const eventType: string = event.event;
    const data = event.data;

    if (eventType === "charge.success" || eventType === "invoice.payment_success") {
      const reference: string = data.reference || data.id;
      const { invoicesTable, milestonesTable } = await import("@workspace/db");
      const { eq } = await import("drizzle-orm");

      const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.paystackReference, reference)).limit(1);
      if (invoice) {
        await db.update(invoicesTable).set({ status: "paid", paidAt: new Date(), updatedAt: new Date() } as any).where(eq(invoicesTable.id, invoice.id));
        if (invoice.milestoneId) {
          await db.update(milestonesTable).set({ status: "paid", updatedAt: new Date() }).where(eq(milestonesTable.id, invoice.milestoneId));
        }
      }
    }

    if (eventType === "subscription.create") {
      const customer = data.customer;
      const customerCode: string = customer?.customer_code || customer?.email;
      const subscriptionCode: string = data.subscription_code;
      await db.update(creatorProfilesTable).set({
        subscriptionPlan: "pro",
        subscriptionStatus: "active",
        paystackCustomerId: customerCode,
        paystackSubscriptionCode: subscriptionCode,
        updatedAt: new Date(),
      } as any).where(eq(creatorProfilesTable.paystackCustomerId, customerCode));
    }

    if (eventType === "subscription.not_renew" || eventType === "subscription.disable") {
      const subscriptionCode: string = data.subscription_code;
      await db.update(creatorProfilesTable).set({
        subscriptionPlan: "starter",
        subscriptionStatus: "cancelled",
        updatedAt: new Date(),
      } as any).where(eq(creatorProfilesTable.paystackSubscriptionCode, subscriptionCode));
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Paystack webhook error");
    res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;
