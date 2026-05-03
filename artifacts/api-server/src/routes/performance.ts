import { Router } from "express";
import { db } from "@workspace/db";
import { milestonesTable, contractsTable, contractExtractionsTable, performanceReportsTable, connectedAccountsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { generatePerformanceReport } from "../lib/ai.js";
import { logger } from "../lib/logger.js";
import { nanoid } from "nanoid";

const router = Router();

router.post("/performance/verify/:milestoneId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const milestoneId = Array.isArray(req.params.milestoneId) ? req.params.milestoneId[0] : req.params.milestoneId;

    const [milestone] = await db.select().from(milestonesTable).where(and(eq(milestonesTable.id, milestoneId), eq(milestonesTable.userId, userId))).limit(1);
    if (!milestone) { res.status(404).json({ error: "Milestone not found" }); return; }

    // Get YouTube connection
    const [ytAccount] = await db.select().from(connectedAccountsTable).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "youtube"))).limit(1);

    if (!ytAccount || ytAccount.status !== "connected") {
      res.status(400).json({ error: "YouTube account not connected. Connect YouTube in Settings > Integrations." });
      return;
    }

    // Fetch recent videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&maxResults=50&type=video&order=date&key=${process.env.YOUTUBE_CLIENT_ID}`,
      { headers: { Authorization: `Bearer ${ytAccount.accessToken}` } }
    );
    const videosData = await videosRes.json() as any;
    const videos = videosData.items || [];

    const requiredHashtags = (milestone.requiredHashtags as string[]) || [];
    const requiredMentions = (milestone.requiredMentions as string[]) || [];
    const requiredLinks = (milestone.requiredLinks as any[]) || [];

    let bestMatch: any = null;
    let bestScore = -1;

    for (const video of videos) {
      const { snippet } = video;
      const description = (snippet.description || "").toLowerCase();
      const title = (snippet.title || "").toLowerCase();
      const fullText = `${title} ${description}`;

      let score = 0;
      const hashtagsFound: string[] = [];
      const mentionsFound: string[] = [];
      const linksFound: string[] = [];

      for (const tag of requiredHashtags) {
        if (fullText.includes(tag.toLowerCase())) { score++; hashtagsFound.push(tag); }
      }
      for (const mention of requiredMentions) {
        if (fullText.includes(mention.toLowerCase().replace("@", ""))) { score++; mentionsFound.push(mention); }
      }
      for (const link of requiredLinks) {
        const url = typeof link === "string" ? link : link.url;
        if (url && description.includes(url)) { score++; linksFound.push(url); }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { video, hashtagsFound, mentionsFound, linksFound };
      }
    }

    let complianceStatus = "needs_review";
    if (bestMatch) {
      const { hashtagsFound, mentionsFound, linksFound } = bestMatch;
      const missingHashtags = requiredHashtags.filter(h => !hashtagsFound.includes(h));
      const missingMentions = requiredMentions.filter(m => !mentionsFound.includes(m));
      const missingLinks = (requiredLinks as any[]).map(l => typeof l === "string" ? l : l.url).filter((l: string) => !linksFound.includes(l));

      if (missingHashtags.length > 0) complianceStatus = "missing_hashtag";
      else if (missingMentions.length > 0) complianceStatus = "missing_mention";
      else if (missingLinks.length > 0) complianceStatus = "missing_link";
      else complianceStatus = "verified";
    }

    const contentUrl = bestMatch ? `https://www.youtube.com/watch?v=${bestMatch.video.id.videoId}` : undefined;

    await db.update(milestonesTable).set({ complianceStatus, contentUrl: contentUrl || milestone.contentUrl, updatedAt: new Date() }).where(eq(milestonesTable.id, milestoneId));

    res.json({ milestoneId, complianceStatus, contentUrl, matchedVideo: bestMatch?.video, checks: bestMatch });
  } catch (err) {
    logger.error({ err }, "Compliance check error");
    res.status(500).json({ error: "Compliance check failed" });
  }
});

router.post("/performance/report/:contractId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const contractId = Array.isArray(req.params.contractId) ? req.params.contractId[0] : req.params.contractId;

    const [contract] = await db.select().from(contractsTable).where(and(eq(contractsTable.id, contractId), eq(contractsTable.userId, userId))).limit(1);
    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

    const [extraction] = await db.select().from(contractExtractionsTable).where(eq(contractExtractionsTable.contractId, contractId)).limit(1);
    const milestones = await db.select().from(milestonesTable).where(eq(milestonesTable.contractId, contractId));

    const campaignData = {
      contract: { title: contract.title },
      extraction: extraction || {},
      milestones: milestones.map(m => ({
        title: m.title, platform: m.platform, status: m.status,
        complianceStatus: m.complianceStatus, contentUrl: m.contentUrl,
        dueDate: m.dueDate, paymentAmount: m.paymentAmount,
        requiredHashtags: m.requiredHashtags, requiredMentions: m.requiredMentions,
        requiredLinks: m.requiredLinks,
      })),
    };

    const reportData = await generatePerformanceReport(campaignData);
    const score = (reportData as any).overall_compliance_score || (reportData as any).campaign_overview?.compliance_score || 0;
    const token = nanoid(32);

    const existing = await db.select().from(performanceReportsTable).where(eq(performanceReportsTable.contractId, contractId)).limit(1);

    let report;
    if (existing.length > 0) {
      [report] = await db.update(performanceReportsTable).set({ reportData, complianceScore: score, sharedToken: token, generatedAt: new Date(), campaignName: extraction?.campaignName, brandName: extraction?.brandName }).where(eq(performanceReportsTable.contractId, contractId)).returning();
    } else {
      [report] = await db.insert(performanceReportsTable).values({ userId, contractId, reportData, complianceScore: score, sharedToken: token, campaignName: extraction?.campaignName, brandName: extraction?.brandName }).returning();
    }

    res.json(report);
  } catch (err) {
    logger.error({ err }, "Performance report error");
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/performance/report/:contractId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const contractId = Array.isArray(req.params.contractId) ? req.params.contractId[0] : req.params.contractId;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(contractId)) { res.status(404).json({ error: "No report found" }); return; }
    const [report] = await db.select().from(performanceReportsTable).where(and(eq(performanceReportsTable.contractId, contractId), eq(performanceReportsTable.userId, userId))).limit(1);
    if (!report) { res.status(404).json({ error: "No report found" }); return; }
    res.json(report);
  } catch (err) {
    logger.error({ err }, "Get performance report error");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/shared/report/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const [report] = await db.select().from(performanceReportsTable).where(eq(performanceReportsTable.sharedToken, token)).limit(1);
    if (!report) { res.status(404).json({ error: "Report not found" }); return; }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
