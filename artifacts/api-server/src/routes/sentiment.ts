import { Router } from "express";
import { db } from "@workspace/db";
import { communicationAnalysesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { analyzeSentiment } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/sentiment/analyze", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { rawInput, contractId } = req.body;
    if (!rawInput) { res.status(400).json({ error: "rawInput is required" }); return; }

    const analysis = await analyzeSentiment(rawInput);

    const [saved] = await db.insert(communicationAnalysesTable).values({
      userId,
      contractId: contractId || null,
      rawInput,
      sentiment: (analysis as any).sentiment,
      urgencyLevel: (analysis as any).urgency_level,
      paymentRisk: (analysis as any).payment_risk,
      scopeCreepRisk: (analysis as any).scope_creep_risk,
      toneRecommendation: (analysis as any).tone_recommendation,
      suggestedReply: (analysis as any).suggested_reply,
      fullAnalysis: analysis,
    }).returning();

    res.json({
      id: saved.id,
      contractId: saved.contractId,
      rawInput: saved.rawInput,
      sentiment: saved.sentiment,
      urgencyLevel: saved.urgencyLevel,
      paymentRisk: saved.paymentRisk,
      scopeCreepRisk: saved.scopeCreepRisk,
      toneRecommendation: saved.toneRecommendation,
      suggestedReply: saved.suggestedReply,
      fullAnalysis: saved.fullAnalysis,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "Sentiment analysis error");
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.get("/sentiment/:contractId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { contractId } = req.params;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(contractId)) { res.json([]); return; }
    const analyses = await db.select().from(communicationAnalysesTable)
      .where(and(eq(communicationAnalysesTable.contractId, contractId), eq(communicationAnalysesTable.userId, userId)))
      .orderBy(desc(communicationAnalysesTable.createdAt));
    res.json(analyses);
  } catch (err) {
    logger.error({ err }, "List sentiment analyses error");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
