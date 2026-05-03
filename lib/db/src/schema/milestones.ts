import { pgTable, text, timestamp, uuid, numeric, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { contractsTable } from "./contracts";
import { usersTable } from "./users";

export const milestonesTable = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").references(() => contractsTable.id).notNull(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  platform: text("platform"),
  dueDate: timestamp("due_date"),
  status: text("status").default("contract_received").notNull(),
  requiredHashtags: jsonb("required_hashtags").default([]),
  requiredMentions: jsonb("required_mentions").default([]),
  requiredLinks: jsonb("required_links").default([]),
  paymentAmount: numeric("payment_amount"),
  requiresApproval: boolean("requires_approval").default(false),
  approvalStatus: text("approval_status"),
  contentUrl: text("content_url"),
  complianceStatus: text("compliance_status").default("unverified"),
  sortOrder: integer("sort_order").default(0),
  remindersSent: jsonb("reminders_sent").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Milestone = typeof milestonesTable.$inferSelect;
export type InsertMilestone = typeof milestonesTable.$inferInsert;
