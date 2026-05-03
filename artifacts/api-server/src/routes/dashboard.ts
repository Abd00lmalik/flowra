import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable, contractExtractionsTable, invoicesTable, taxReservesTable, milestonesTable, communicationAnalysesTable } from "@workspace/db";
import { eq, and, lte, gte, sql, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    // Total contract value from extractions
    const [contractValueResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${contractExtractionsTable.totalPayment}::numeric), 0)` })
      .from(contractExtractionsTable)
      .innerJoin(contractsTable, eq(contractExtractionsTable.contractId, contractsTable.id))
      .where(eq(contractsTable.userId, userId));

    // Paid revenue
    const [paidRevenueResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)` })
      .from(invoicesTable)
      .where(and(eq(invoicesTable.userId, userId), eq(invoicesTable.status, "paid")));

    // Pending invoices count + total
    const [pendingResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<string>`COALESCE(SUM(${invoicesTable.amount}::numeric), 0)`,
      })
      .from(invoicesTable)
      .where(and(eq(invoicesTable.userId, userId), eq(invoicesTable.status, "sent")));

    // Tax reserve total
    const [taxReserveResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${taxReservesTable.reserveAmount}::numeric), 0)` })
      .from(taxReservesTable)
      .where(eq(taxReservesTable.userId, userId));

    // Active contracts count
    const [activeContractsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contractsTable)
      .where(and(eq(contractsTable.userId, userId), eq(contractsTable.status, "active")));

    // Overdue milestones count
    const [overdueMilestonesResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(milestonesTable)
      .where(and(eq(milestonesTable.userId, userId), eq(milestonesTable.status, "overdue")));

    res.json({
      totalContractValue: contractValueResult?.total || "0",
      paidRevenue: paidRevenueResult?.total || "0",
      pendingInvoicesCount: Number(pendingResult?.count || 0),
      pendingInvoicesTotal: pendingResult?.total || "0",
      taxReserveTotal: taxReserveResult?.total || "0",
      activeContractsCount: Number(activeContractsResult?.count || 0),
      overdueMilestonesCount: Number(overdueMilestonesResult?.count || 0),
    });
  } catch (err) {
    logger.error({ err }, "Dashboard summary error");
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

router.get("/dashboard/upcoming", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const milestones = await db
      .select({
        id: milestonesTable.id,
        contractId: milestonesTable.contractId,
        userId: milestonesTable.userId,
        title: milestonesTable.title,
        description: milestonesTable.description,
        platform: milestonesTable.platform,
        dueDate: milestonesTable.dueDate,
        status: milestonesTable.status,
        paymentAmount: milestonesTable.paymentAmount,
        requiresApproval: milestonesTable.requiresApproval,
        approvalStatus: milestonesTable.approvalStatus,
        contentUrl: milestonesTable.contentUrl,
        complianceStatus: milestonesTable.complianceStatus,
        sortOrder: milestonesTable.sortOrder,
        requiredHashtags: milestonesTable.requiredHashtags,
        requiredMentions: milestonesTable.requiredMentions,
        requiredLinks: milestonesTable.requiredLinks,
        remindersSent: milestonesTable.remindersSent,
        createdAt: milestonesTable.createdAt,
        updatedAt: milestonesTable.updatedAt,
        contractTitle: contractsTable.title,
      })
      .from(milestonesTable)
      .innerJoin(contractsTable, eq(milestonesTable.contractId, contractsTable.id))
      .where(
        and(
          eq(milestonesTable.userId, userId),
          gte(milestonesTable.dueDate, now),
          lte(milestonesTable.dueDate, in14Days)
        )
      )
      .orderBy(milestonesTable.dueDate)
      .limit(20);

    res.json(milestones);
  } catch (err) {
    logger.error({ err }, "Dashboard upcoming error");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/dashboard/risk-alerts", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const overdueMilestones = await db
      .select()
      .from(milestonesTable)
      .where(and(eq(milestonesTable.userId, userId), eq(milestonesTable.status, "overdue")))
      .limit(10);

    const contracts = await db
      .select()
      .from(contractsTable)
      .innerJoin(contractExtractionsTable, eq(contractExtractionsTable.contractId, contractsTable.id))
      .where(eq(contractsTable.userId, userId))
      .limit(50);

    const riskFlagContracts = contracts
      .filter(c => {
        const flags = c.contract_extractions.riskFlags as any[];
        return Array.isArray(flags) && flags.length > 0;
      })
      .slice(0, 5)
      .map(c => ({ contract: c.contracts, extraction: c.contract_extractions }));

    res.json({ overdueMilestones, riskFlagContracts });
  } catch (err) {
    logger.error({ err }, "Risk alerts error");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/dashboard/income-trend", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${invoicesTable.paidAt}, 'YYYY-MM')`,
        amount: sql<string>`SUM(${invoicesTable.amount}::numeric)`,
      })
      .from(invoicesTable)
      .where(and(eq(invoicesTable.userId, userId), eq(invoicesTable.status, "paid")))
      .groupBy(sql`TO_CHAR(${invoicesTable.paidAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoicesTable.paidAt}, 'YYYY-MM')`);

    res.json(result);
  } catch (err) {
    logger.error({ err }, "Income trend error");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/dashboard/sentiment-snapshot", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const analyses = await db
      .select()
      .from(communicationAnalysesTable)
      .where(eq(communicationAnalysesTable.userId, userId))
      .orderBy(desc(communicationAnalysesTable.createdAt))
      .limit(5);
    res.json(analyses);
  } catch (err) {
    logger.error({ err }, "Sentiment snapshot error");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
