import { Router } from "express";
import { db } from "@workspace/db";
import { milestonesTable, contractsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/contracts/:id/milestones", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    if (!UUID_RE.test(id)) { res.status(404).json({ error: "Contract not found" }); return; }

    const [contract] = await db.select().from(contractsTable).where(and(eq(contractsTable.id, id), eq(contractsTable.userId, userId))).limit(1);
    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

    const milestones = await db.select().from(milestonesTable).where(eq(milestonesTable.contractId, id)).orderBy(milestonesTable.sortOrder, milestonesTable.createdAt);
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/contracts/:id/milestones", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const [contract] = await db.select().from(contractsTable).where(and(eq(contractsTable.id, id), eq(contractsTable.userId, userId))).limit(1);
    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

    const { title, description, platform, dueDate, paymentAmount, requiresApproval, requiredHashtags, requiredMentions, requiredLinks } = req.body;

    const [milestone] = await db.insert(milestonesTable).values({
      contractId: id, userId, title, description, platform,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      paymentAmount: paymentAmount?.toString(),
      requiresApproval: requiresApproval || false,
      requiredHashtags: requiredHashtags || [],
      requiredMentions: requiredMentions || [],
      requiredLinks: requiredLinks || [],
    }).returning();

    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/milestones/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const [milestone] = await db.select().from(milestonesTable).where(and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))).limit(1);
    if (!milestone) { res.status(404).json({ error: "Not found" }); return; }
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/milestones/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const [existing] = await db.select().from(milestonesTable).where(and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const allowed = ["title","description","platform","dueDate","status","paymentAmount","requiresApproval","approvalStatus","contentUrl","complianceStatus","sortOrder","requiredHashtags","requiredMentions","requiredLinks"];
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "dueDate") updates["dueDate"] = req.body[key] ? new Date(req.body[key]) : null;
        else if (key === "paymentAmount") updates["paymentAmount"] = req.body[key]?.toString();
        else {
          const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          updates[dbKey] = req.body[key];
        }
      }
    }

    const [updated] = await db.update(milestonesTable).set(updates as any).where(eq(milestonesTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.delete("/milestones/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const [existing] = await db.select().from(milestonesTable).where(and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(milestonesTable).where(eq(milestonesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
