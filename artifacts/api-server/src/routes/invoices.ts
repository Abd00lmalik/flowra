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
      paystackReference: invoicesTable.paystackReference,
      paystackPaymentUrl: invoicesTable.paystackPaymentUrl,
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

    let paystackReference: string | undefined;
    let paystackPaymentUrl: string | undefined;

    if (process.env.PAYSTACK_SECRET_KEY) {
      try {
        const reference = `flowra_inv_${userId}_${Date.now()}`;
        const amountInKobo = Math.round(grossAmount * 100);

        const paystackRes = await fetch("https://api.paystack.co/paymentrequest", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: { email: brandEmail },
            amount: amountInKobo,
            description: notes || `Sponsorship invoice for ${brandName}`,
            due_date: dueDate ? new Date(dueDate).toISOString().split("T")[0] : undefined,
            line_items: [
              { name: "Sponsorship fee", amount: amountInKobo, quantity: 1 },
              ...(isAgency && platformFee > 0 ? [
                { name: "Flowra platform fee (1%)", amount: Math.round(platformFee * 100), quantity: 1 }
              ] : []),
            ],
          }),
        });

        const paystackData = await paystackRes.json() as any;
        if (paystackData.status && paystackData.data) {
          paystackReference = reference;
          paystackPaymentUrl = paystackData.data.offline_reference || paystackData.data.payment_url || undefined;
        }
      } catch (paystackErr) {
        logger.error({ paystackErr }, "Paystack payment request creation failed");
      }
    }

    const [savedInvoice] = await db.insert(invoicesTable).values({
      userId, contractId, milestoneId,
      paystackReference, paystackPaymentUrl,
      status: paystackReference ? "sent" : "draft",
      amount: amount.toString(), currency: currency || "USD",
      platformFee: platformFee.toString(), netAmount: netAmount.toString(),
      brandName, brandEmail,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    }).returning();

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

export default router;
