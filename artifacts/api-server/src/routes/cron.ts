import { Router } from "express";
import { db } from "@workspace/db";
import { milestonesTable, remindersTable, usersTable, contractsTable } from "@workspace/db";
import { eq, and, lte, gte, notInArray } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/cron/reminders", async (req, res) => {
  try {
    const cronSecret = req.headers["x-cron-secret"];
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const activeMilestones = await db
      .select({
        milestone: milestonesTable,
        user: usersTable,
        contractTitle: contractsTable.title,
      })
      .from(milestonesTable)
      .innerJoin(usersTable, eq(milestonesTable.userId, usersTable.id))
      .innerJoin(contractsTable, eq(milestonesTable.contractId, contractsTable.id))
      .where(notInArray(milestonesTable.status, ["paid", "cancelled"]));

    let sent = 0;

    for (const { milestone, user, contractTitle } of activeMilestones) {
      if (!user.email || !milestone.dueDate) continue;

      const dueDate = new Date(milestone.dueDate);
      const remindersSent = (milestone.remindersSent as string[]) || [];

      const types: Array<{ key: string; condition: boolean; label: string }> = [
        { key: "7day", condition: dueDate <= in7Days && dueDate > in3Days && !remindersSent.includes("7day"), label: "in 7 days" },
        { key: "3day", condition: dueDate <= in3Days && dueDate > tomorrow && !remindersSent.includes("3day"), label: "in 3 days" },
        { key: "1day", condition: dueDate <= tomorrow && dueDate > now && !remindersSent.includes("1day"), label: "TODAY" },
        { key: "overdue", condition: dueDate < now && !remindersSent.includes("overdue"), label: "OVERDUE" },
      ];

      for (const { key, condition, label } of types) {
        if (!condition) continue;

        if (process.env.RESEND_API_KEY) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const domain = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost";

            await resend.emails.send({
              from: process.env.FROM_EMAIL || "noreply@flowra.app",
              to: user.email,
              subject: `${milestone.title} is due ${label} — Flowra`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #FFB800;">Flowra Reminder</h2>
                  <p>Your milestone <strong>${milestone.title}</strong> from <strong>${contractTitle}</strong> is due <strong>${label}</strong>.</p>
                  <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
                  ${milestone.paymentAmount ? `<p><strong>Payment:</strong> $${milestone.paymentAmount}</p>` : ""}
                  ${Array.isArray(milestone.requiredHashtags) && milestone.requiredHashtags.length > 0 ? `<p><strong>Required Hashtags:</strong> ${(milestone.requiredHashtags as string[]).join(", ")}</p>` : ""}
                  ${Array.isArray(milestone.requiredMentions) && milestone.requiredMentions.length > 0 ? `<p><strong>Required Mentions:</strong> ${(milestone.requiredMentions as string[]).join(", ")}</p>` : ""}
                  ${key === "overdue" ? "<p style='color: red;'><strong>This milestone is overdue. Please generate an invoice or update its status.</strong></p>" : ""}
                  <a href="${domain}/app/contracts/${milestone.contractId}/milestones" style="display: inline-block; background: #FFB800; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px; font-weight: 600;">View Milestone</a>
                </div>
              `,
            });

            await db.insert(remindersTable).values({ userId: milestone.userId, milestoneId: milestone.id, type: key, sentAt: now, status: "sent" });
            await db.update(milestonesTable).set({ remindersSent: [...remindersSent, key] } as any).where(eq(milestonesTable.id, milestone.id));
            sent++;
          } catch (emailErr) {
            logger.error({ emailErr }, "Failed to send reminder email");
            await db.insert(remindersTable).values({ userId: milestone.userId, milestoneId: milestone.id, type: key, sentAt: now, status: "failed" });
          }
        } else {
          // Log reminder without sending
          logger.info({ milestoneId: milestone.id, type: key, userId: milestone.userId }, "Reminder would be sent (RESEND not configured)");
          await db.insert(remindersTable).values({ userId: milestone.userId, milestoneId: milestone.id, type: key, sentAt: now, status: "sent" });
          await db.update(milestonesTable).set({ remindersSent: [...remindersSent, key] } as any).where(eq(milestonesTable.id, milestone.id));
          sent++;
        }
      }
    }

    res.json({ success: true, remindersSent: sent });
  } catch (err) {
    logger.error({ err }, "Cron reminders error");
    res.status(500).json({ error: "Cron job failed" });
  }
});

export default router;
