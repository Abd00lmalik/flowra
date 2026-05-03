import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable, contractExtractionsTable, milestonesTable, performanceReportsTable, notionExportsTable, connectedAccountsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

async function getNotionToken(userId: string): Promise<string | null> {
  if (process.env.NOTION_API_KEY) return process.env.NOTION_API_KEY;
  const [account] = await db.select().from(connectedAccountsTable).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "notion"))).limit(1);
  return account?.accessToken || null;
}

router.post("/notion/export/contract/:contractId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const contractId = Array.isArray(req.params.contractId) ? req.params.contractId[0] : req.params.contractId;
    const { databaseId } = req.body;
    if (!databaseId) { res.status(400).json({ error: "databaseId is required" }); return; }

    const notionToken = await getNotionToken(userId);
    if (!notionToken) { res.status(400).json({ error: "Notion not configured. Add NOTION_API_KEY in settings." }); return; }

    const [result] = await db.select({ contract: contractsTable, extraction: contractExtractionsTable })
      .from(contractsTable)
      .leftJoin(contractExtractionsTable, eq(contractExtractionsTable.contractId, contractsTable.id))
      .where(and(eq(contractsTable.id, contractId), eq(contractsTable.userId, userId)));

    if (!result) { res.status(404).json({ error: "Contract not found" }); return; }

    const { contract, extraction } = result;

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${notionToken}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          title: { title: [{ text: { content: contract.title } }] },
        },
        children: [
          { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "AI Summary" } }] } },
          { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: extraction?.aiSummary || "No summary available" } }] } },
          { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "Contract Details" } }] } },
          { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: `Brand: ${extraction?.brandName || "Unknown"}\nTotal Payment: ${extraction?.currency || "USD"} ${extraction?.totalPayment || 0}\nCampaign: ${extraction?.campaignName || "N/A"}` } }] } },
          ...(Array.isArray(extraction?.riskFlags) && (extraction.riskFlags as any[]).length > 0 ? [
            { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "Risk Flags" } }] } },
            ...(extraction!.riskFlags as any[]).map((flag: any) => ({
              object: "block", type: "paragraph",
              paragraph: { rich_text: [{ text: { content: `[${flag.severity?.toUpperCase()}] ${flag.flag}: ${flag.clause || ""}` } }] }
            }))
          ] : []),
        ],
      }),
    });

    if (!notionRes.ok) {
      const errData = await notionRes.json() as any;
      throw new Error(errData.message || "Notion API error");
    }

    const notionPage = await notionRes.json() as any;

    await db.insert(notionExportsTable).values({
      userId, contractId, notionPageId: notionPage.id, notionDatabaseId: databaseId,
      exportType: "contract", status: "success",
    });

    res.json({ notionPageId: notionPage.id, notionUrl: notionPage.url, status: "success" });
  } catch (err) {
    logger.error({ err }, "Notion export error");
    const contractIdParam = Array.isArray(req.params.contractId) ? req.params.contractId[0] : req.params.contractId;
    await db.insert(notionExportsTable).values({ userId: (req as any).userId, contractId: contractIdParam, exportType: "contract", status: "failed" });
    res.status(500).json({ error: "Export failed" });
  }
});

router.post("/notion/export/milestones/:contractId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const contractId = Array.isArray(req.params.contractId) ? req.params.contractId[0] : req.params.contractId;
    const { databaseId } = req.body;
    if (!databaseId) { res.status(400).json({ error: "databaseId is required" }); return; }

    const notionToken = await getNotionToken(userId);
    if (!notionToken) { res.status(400).json({ error: "Notion not configured" }); return; }

    const milestones = await db.select().from(milestonesTable).where(eq(milestonesTable.contractId, contractId));

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${notionToken}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: { title: { title: [{ text: { content: `Milestones - Contract ${contractId.slice(0, 8)}` } }] } },
        children: milestones.map(m => ({
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `${m.title} | ${m.platform || "N/A"} | Due: ${m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "N/A"} | Status: ${m.status} | $${m.paymentAmount || 0}` } }] }
        })),
      }),
    });

    if (!notionRes.ok) throw new Error("Notion API error");
    const notionPage = await notionRes.json() as any;
    await db.insert(notionExportsTable).values({ userId, contractId, notionPageId: notionPage.id, notionDatabaseId: databaseId, exportType: "milestones", status: "success" });
    res.json({ notionPageId: notionPage.id, notionUrl: notionPage.url, status: "success" });
  } catch (err) {
    logger.error({ err }, "Notion milestones export error");
    res.status(500).json({ error: "Export failed" });
  }
});

router.post("/notion/export/report/:contractId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const contractId = Array.isArray(req.params.contractId) ? req.params.contractId[0] : req.params.contractId;
    const { databaseId } = req.body;
    if (!databaseId) { res.status(400).json({ error: "databaseId is required" }); return; }

    const notionToken = await getNotionToken(userId);
    if (!notionToken) { res.status(400).json({ error: "Notion not configured" }); return; }

    const [report] = await db.select().from(performanceReportsTable).where(and(eq(performanceReportsTable.contractId, contractId), eq(performanceReportsTable.userId, userId))).limit(1);
    if (!report) { res.status(404).json({ error: "No performance report found" }); return; }

    const reportData = report.reportData as any;

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${notionToken}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: { title: { title: [{ text: { content: `Performance Report - ${report.campaignName || contractId.slice(0, 8)}` } }] } },
        children: [
          { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "Executive Summary" } }] } },
          { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: reportData?.executive_summary || "N/A" } }] } },
          { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: `Compliance Score: ${report.complianceScore}%` } }] } },
          { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: reportData?.recommendations || "N/A" } }] } },
        ],
      }),
    });

    if (!notionRes.ok) throw new Error("Notion API error");
    const notionPage = await notionRes.json() as any;
    await db.insert(notionExportsTable).values({ userId, contractId, notionPageId: notionPage.id, notionDatabaseId: databaseId, exportType: "report", status: "success" });
    res.json({ notionPageId: notionPage.id, notionUrl: notionPage.url, status: "success" });
  } catch (err) {
    logger.error({ err }, "Notion report export error");
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;
