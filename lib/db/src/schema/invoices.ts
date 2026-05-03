import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { contractsTable } from "./contracts";
import { milestonesTable } from "./milestones";

export const invoicesTable = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  contractId: uuid("contract_id").references(() => contractsTable.id),
  milestoneId: uuid("milestone_id").references(() => milestonesTable.id),
  paystackReference: text("stripe_invoice_id"),
  paystackPaymentUrl: text("stripe_invoice_url"),
  status: text("status").default("draft").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("USD"),
  platformFee: numeric("platform_fee").default("0"),
  netAmount: numeric("net_amount"),
  brandName: text("brand_name"),
  brandEmail: text("brand_email"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Invoice = typeof invoicesTable.$inferSelect;
export type InsertInvoice = typeof invoicesTable.$inferInsert;
