import { Router } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import {
  contractsTable, contractExtractionsTable, milestonesTable, auditLogsTable
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { saveFile, getFileBuffer } from "../lib/storage.js";
import { extractContractData } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get("/contracts", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;

    let query = db
      .select({
        contract: contractsTable,
        extraction: contractExtractionsTable,
      })
      .from(contractsTable)
      .leftJoin(contractExtractionsTable, eq(contractExtractionsTable.contractId, contractsTable.id))
      .where(eq(contractsTable.userId, userId));

    const results = await query;
    const filtered = status ? results.filter(r => r.contract.status === status) : results;

    const mapped = filtered.map(r => ({
      contract: r.contract,
      extraction: r.extraction,
      milestonesCount: 0,
      notionExports: [],
    }));

    res.json(mapped);
  } catch (err) {
    logger.error({ err }, "List contracts error");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/contracts/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    if (req.file.mimetype !== "application/pdf") { res.status(400).json({ error: "Only PDF files allowed" }); return; }

    const fileUrl = await saveFile(req.file.buffer, req.file.originalname);
    const title = (req.body.title as string) || req.file.originalname.replace(".pdf", "");

    const [contract] = await db.insert(contractsTable).values({
      userId, title, originalFilename: req.file.originalname, fileUrl,
      fileSize: req.file.size, aiProcessingStatus: "pending",
    }).returning();

    // Trigger background extraction (fire-and-forget)
    processContractExtraction(contract.id, req.file.buffer, userId).catch(err =>
      logger.error({ err, contractId: contract.id }, "Background extraction failed")
    );

    res.status(201).json(contract);
  } catch (err) {
    logger.error({ err }, "Upload error");
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/contracts/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const [result] = await db
      .select({ contract: contractsTable, extraction: contractExtractionsTable })
      .from(contractsTable)
      .leftJoin(contractExtractionsTable, eq(contractExtractionsTable.contractId, contractsTable.id))
      .where(and(eq(contractsTable.id, id), eq(contractsTable.userId, userId)));

    if (!result) { res.status(404).json({ error: "Not found" }); return; }

    const milestoneCount = await db.select().from(milestonesTable).where(eq(milestonesTable.contractId, id));

    res.json({ contract: result.contract, extraction: result.extraction, milestonesCount: milestoneCount.length, notionExports: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/contracts/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, status } = req.body;

    const [existing] = await db.select().from(contractsTable).where(and(eq(contractsTable.id, id), eq(contractsTable.userId, userId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const [updated] = await db.update(contractsTable).set({ ...(title && { title }), ...(status && { status }), updatedAt: new Date() }).where(eq(contractsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.delete("/contracts/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const [existing] = await db.select().from(contractsTable).where(and(eq(contractsTable.id, id), eq(contractsTable.userId, userId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    await db.delete(milestonesTable).where(eq(milestonesTable.contractId, id));
    await db.delete(contractExtractionsTable).where(eq(contractExtractionsTable.contractId, id));
    await db.delete(contractsTable).where(eq(contractsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/contracts/:id/reprocess", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const [contract] = await db.select().from(contractsTable).where(and(eq(contractsTable.id, id), eq(contractsTable.userId, userId))).limit(1);
    if (!contract) { res.status(404).json({ error: "Not found" }); return; }
    if (!contract.fileUrl) { res.status(400).json({ error: "No file to reprocess" }); return; }

    await db.update(contractsTable).set({ aiProcessingStatus: "pending", aiError: null, updatedAt: new Date() }).where(eq(contractsTable.id, id));

    const fileBuffer = await getFileBuffer(contract.fileUrl);
    if (fileBuffer) {
      processContractExtraction(id, fileBuffer, userId).catch(err =>
        logger.error({ err, contractId: id }, "Reprocess extraction failed")
      );
    }

    const [updated] = await db.select().from(contractsTable).where(eq(contractsTable.id, id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/contracts/:id/extraction", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const [contract] = await db.select().from(contractsTable).where(and(eq(contractsTable.id, id), eq(contractsTable.userId, userId))).limit(1);
    if (!contract) { res.status(404).json({ error: "Not found" }); return; }

    const [existing] = await db.select().from(contractExtractionsTable).where(eq(contractExtractionsTable.contractId, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Extraction not found" }); return; }

    const updates: Record<string, unknown> = { editedByUser: true, updatedAt: new Date() };
    const allowed = ["brandName","creatorName","campaignName","totalPayment","currency","paymentSchedule","deliverables","requiredHashtags","requiredMentions","requiredLinks","riskFlags","aiSummary","approvalRequirements","revisionTerms","usageRights","exclusivityClauses","latePaymentTerms","cancellationTerms"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updates[dbKey] = req.body[key];
      }
    }

    const [updated] = await db.update(contractExtractionsTable).set(updates as any).where(eq(contractExtractionsTable.contractId, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

async function processContractExtraction(contractId: string, fileBuffer: Buffer, userId: string) {
  try {
    await db.update(contractsTable).set({ aiProcessingStatus: "processing", updatedAt: new Date() }).where(eq(contractsTable.id, contractId));

    // Parse PDF text
    let pdfText = "";
    try {
      const pdfParse = (await import("pdf-parse") as any).default;
      const parsed = await pdfParse(fileBuffer);
      pdfText = parsed.text;
    } catch (pdfErr) {
      logger.error({ pdfErr }, "PDF parse error, using fallback");
      pdfText = "Unable to extract text from PDF. Please review the contract manually.";
    }

    await db.update(contractsTable).set({ rawExtractedText: pdfText, updatedAt: new Date() }).where(eq(contractsTable.id, contractId));

    // AI Extraction
    const extracted = await extractContractData(pdfText);

    const [existing] = await db.select().from(contractExtractionsTable).where(eq(contractExtractionsTable.contractId, contractId)).limit(1);

    let extraction;
    const extractionData = {
      brandName: extracted.brand_name as string,
      creatorName: extracted.creator_name as string,
      campaignName: extracted.campaign_name as string,
      totalPayment: extracted.total_payment?.toString(),
      currency: (extracted.currency as string) || "USD",
      paymentSchedule: extracted.payment_schedule,
      deliverables: extracted.deliverables,
      deadlines: extracted.deadlines,
      platforms: extracted.platforms,
      requiredHashtags: extracted.required_hashtags,
      requiredMentions: extracted.required_mentions,
      requiredLinks: extracted.required_links,
      approvalRequirements: extracted.approval_requirements as string,
      revisionTerms: extracted.revision_terms as string,
      usageRights: extracted.usage_rights as string,
      exclusivityClauses: extracted.exclusivity_clauses as string,
      latePaymentTerms: extracted.late_payment_terms as string,
      cancellationTerms: extracted.cancellation_terms as string,
      riskFlags: extracted.risk_flags,
      aiSummary: extracted.summary as string,
      rawJson: extracted,
      updatedAt: new Date(),
    };

    if (existing) {
      [extraction] = await db.update(contractExtractionsTable).set(extractionData).where(eq(contractExtractionsTable.contractId, contractId)).returning();
    } else {
      [extraction] = await db.insert(contractExtractionsTable).values({ contractId, ...extractionData }).returning();
    }

    // Update contract title if we got one
    if (extracted.contract_title || extracted.brand_name) {
      const newTitle = (extracted.contract_title || `${extracted.brand_name} Campaign`) as string;
      await db.update(contractsTable).set({ title: newTitle, updatedAt: new Date() }).where(eq(contractsTable.id, contractId));
    }

    // Auto-generate milestones from deliverables
    const deliverables = extracted.deliverables as any[];
    if (Array.isArray(deliverables) && deliverables.length > 0) {
      const existingMilestones = await db.select().from(milestonesTable).where(eq(milestonesTable.contractId, contractId));
      if (existingMilestones.length === 0) {
        for (let i = 0; i < deliverables.length; i++) {
          const d = deliverables[i];
          await db.insert(milestonesTable).values({
            contractId, userId,
            title: d.title || `Deliverable ${i + 1}`,
            description: d.format_requirements,
            platform: d.platform,
            dueDate: d.due_date ? new Date(d.due_date) : undefined,
            paymentAmount: d.payment_amount?.toString(),
            requiresApproval: d.requires_approval || false,
            requiredHashtags: extracted.required_hashtags || [],
            requiredMentions: extracted.required_mentions || [],
            requiredLinks: extracted.required_links || [],
            sortOrder: i,
          });
        }
      }
    }

    await db.update(contractsTable).set({ aiProcessingStatus: "complete", updatedAt: new Date() }).where(eq(contractsTable.id, contractId));

    await db.insert(auditLogsTable).values({ userId, action: "contract_extraction_complete", entityType: "contract", entityId: contractId as any, metadata: { extractedFields: Object.keys(extractionData) } });

  } catch (err) {
    logger.error({ err, contractId }, "Extraction failed");
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    await db.update(contractsTable).set({ aiProcessingStatus: "failed", aiError: errorMsg, updatedAt: new Date() }).where(eq(contractsTable.id, contractId));
  }
}

export default router;
