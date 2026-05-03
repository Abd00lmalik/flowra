import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, contractsTable, creatorProfilesTable, taxReservesTable, milestonesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/invoices", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { status, contractId } = req.query;

    const invoices = await db.select({
      id: invoicesTable.id,
      userId: invoicesTable.userId,
      contractId: invoicesTable.contractId,
      milestoneId: invoicesTable.milestoneId,
      stripeInvoiceId: invoicesTable.stripeInvoiceId,
      stripeInvoiceUrl: invoicesTable.stripeInvoiceUrl,
      status: invoicesTable.status,
      amount: invoicesTable.amount,
      currency: invoicesTable.currency,
      platformFee: invoicesTable.platformFee,
      netAmount: invoicesTable.netAmount,
      brandName: invoicesTable.brandName,
      brandEmail: invoicesTable.brandEmail,
      dueDate: invoicesTable.dueDate,
      paidAt: invoicesTable.paidAt,
      notes: invoicesTable.notes,
      createdAt: invoicesTable.createdAt,
      updatedAt: invoicesTable.updatedAt,
      contractTitle: contractsTable.title,
    }).from(invoicesTable)
      .leftJoin(contractsTable, eq(invoicesTable.contractId, contractsTable.id))
      .where(eq(invoicesTable.userId, userId));

    let filtered = invoices;
    if (status) filtered = filtered.filter(i => i.status === status);
    if (contractId) filtered = filtered.filter(i => i.contractId === contractId);

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/invoices", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { contractId, milestoneId, amount, currency, brandName, brandEmail, dueDate, notes } = req.body;

    if (!contractId || !amount || !brandName || !brandEmail) {
      res.status(400).json({ error: "contractId, amount, brandName, brandEmail required" });
      return;
    }

    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);

    const grossAmount = parseFloat(amount);
    const isAgency = profile?.subscriptionPlan === "agency";
    const platformFee = isAgency ? grossAmount * 0.01 : 0;
    const netAmount = grossAmount - platformFee;

    let stripeInvoiceId: string | undefined;
    let stripeInvoiceUrl: string | undefined;

    // Attempt Stripe invoice creation
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Find or create Stripe customer
        let customerId = profile?.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({ email: brandEmail, name: brandName });
          customerId = customer.id;
          if (profile) {
            await db.update(creatorProfilesTable).set({ stripeCustomerId: customerId }).where(eq(creatorProfilesTable.userId, userId));
          }
        }

        const daysUntilDue = profile?.paymentTermsDays || 30;
        const invoice = await stripe.invoices.create({
          customer: customerId,
          auto_advance: false,
          collection_method: "send_invoice",
          days_until_due: daysUntilDue,
          description: notes || `Sponsorship invoice from ${brandName}`,
        });

        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: Math.round(grossAmount * 100),
          currency: (currency || "usd").toLowerCase(),
          description: `Sponsorship fee`,
        });

        if (isAgency && platformFee > 0) {
          await stripe.invoiceItems.create({
            customer: customerId,
            invoice: invoice.id,
            amount: Math.round(platformFee * 100),
            currency: (currency || "usd").toLowerCase(),
            description: "SponsorshipOS platform fee (1%)",
          });
        }

        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.sendInvoice(finalizedInvoice.id);

        stripeInvoiceId = finalizedInvoice.id;
        stripeInvoiceUrl = finalizedInvoice.hosted_invoice_url || undefined;
      } catch (stripeErr) {
        logger.error({ stripeErr }, "Stripe invoice creation failed");
      }
    }

    const [savedInvoice] = await db.insert(invoicesTable).values({
      userId, contractId, milestoneId,
      stripeInvoiceId, stripeInvoiceUrl,
      status: stripeInvoiceId ? "sent" : "draft",
      amount: amount.toString(), currency: currency || "USD",
      platformFee: platformFee.toString(), netAmount: netAmount.toString(),
      brandName, brandEmail,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    }).returning();

    // Calculate and save tax reserve
    const reservePercent = profile?.taxReservePercent || 30;
    const reserveAmount = netAmount * (reservePercent / 100);
    const availableBalance = netAmount - reserveAmount;
    const period = new Date().toISOString().slice(0, 7);

    await db.insert(taxReservesTable).values({
      userId, invoiceId: savedInvoice.id,
      grossAmount: grossAmount.toString(),
      platformFee: platformFee.toString(),
      netAmount: netAmount.toString(),
      reservePercent, reserveAmount: reserveAmount.toString(),
      availableBalance: availableBalance.toString(),
      period,
    });

    // Update milestone status
    if (milestoneId) {
      await db.update(milestonesTable).set({ status: "invoice_ready", updatedAt: new Date() }).where(eq(milestonesTable.id, milestoneId));
    }

    res.status(201).json(savedInvoice);
  } catch (err) {
    logger.error({ err }, "Create invoice error");
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.get("/invoices/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [invoice] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId))).limit(1);
    if (!invoice) { res.status(404).json({ error: "Not found" }); return; }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/invoices/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes } = req.body;

    const [existing] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates["status"] = status;
    if (notes !== undefined) updates["notes"] = notes;

    const [updated] = await db.update(invoicesTable).set(updates as any).where(eq(invoicesTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// Stripe webhook
router.post("/webhooks/stripe", async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    if (!process.env.STRIPE_SECRET_KEY || !sig) { res.status(400).send("Stripe not configured"); return; }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch {
      res.status(400).send("Webhook signature verification failed");
      return;
    }

    const stripeInvoice = event.data.object as any;
    const stripeInvoiceId = stripeInvoice.id;

    if (["invoice.paid", "invoice.payment_failed", "invoice.voided", "invoice.sent"].includes(event.type)) {
      const statusMap: Record<string, string> = {
        "invoice.paid": "paid",
        "invoice.payment_failed": "failed",
        "invoice.voided": "cancelled",
        "invoice.sent": "sent",
      };
      const newStatus = statusMap[event.type];
      const updates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
      if (event.type === "invoice.paid") updates["paidAt"] = new Date();

      await db.update(invoicesTable).set(updates as any).where(eq(invoicesTable.stripeInvoiceId, stripeInvoiceId));

      if (event.type === "invoice.paid") {
        const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.stripeInvoiceId, stripeInvoiceId)).limit(1);
        if (invoice) {
          await db.update(milestonesTable).set({ status: "paid", updatedAt: new Date() }).where(eq(milestonesTable.id, invoice.milestoneId || ""));
        }
      }
    }

    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const sub = event.data.object as any;
      const customerId = sub.customer;
      const plan = event.type === "customer.subscription.deleted" ? "starter" : "pro";
      await db.update(creatorProfilesTable).set({ subscriptionPlan: plan, subscriptionStatus: sub.status, stripeSubscriptionId: sub.id }).where(eq(creatorProfilesTable.stripeCustomerId, customerId));
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Stripe webhook error");
    res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;
