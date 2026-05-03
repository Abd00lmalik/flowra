import { Router } from "express";
import { db } from "@workspace/db";
import { taxReservesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/tax", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const [summary] = await db
      .select({
        totalGrossIncome: sql<string>`COALESCE(SUM(gross_amount::numeric), 0)`,
        totalPlatformFees: sql<string>`COALESCE(SUM(platform_fee::numeric), 0)`,
        totalNetIncome: sql<string>`COALESCE(SUM(net_amount::numeric), 0)`,
        totalTaxReserve: sql<string>`COALESCE(SUM(reserve_amount::numeric), 0)`,
        totalAvailableBalance: sql<string>`COALESCE(SUM(available_balance::numeric), 0)`,
      })
      .from(taxReservesTable)
      .where(eq(taxReservesTable.userId, userId));

    res.json({
      totalGrossIncome: summary?.totalGrossIncome || "0",
      totalPlatformFees: summary?.totalPlatformFees || "0",
      totalNetIncome: summary?.totalNetIncome || "0",
      totalTaxReserve: summary?.totalTaxReserve || "0",
      totalAvailableBalance: summary?.totalAvailableBalance || "0",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/tax/history", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const history = await db
      .select()
      .from(taxReservesTable)
      .where(eq(taxReservesTable.userId, userId))
      .orderBy(sql`created_at DESC`);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
