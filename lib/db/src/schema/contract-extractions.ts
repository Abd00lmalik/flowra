import { pgTable, text, timestamp, uuid, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { contractsTable } from "./contracts";

export const contractExtractionsTable = pgTable("contract_extractions", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").references(() => contractsTable.id).notNull(),
  brandName: text("brand_name"),
  creatorName: text("creator_name"),
  campaignName: text("campaign_name"),
  totalPayment: numeric("total_payment"),
  currency: text("currency").default("USD"),
  paymentSchedule: jsonb("payment_schedule"),
  deliverables: jsonb("deliverables"),
  deadlines: jsonb("deadlines"),
  platforms: jsonb("platforms"),
  requiredHashtags: jsonb("required_hashtags"),
  requiredMentions: jsonb("required_mentions"),
  requiredLinks: jsonb("required_links"),
  approvalRequirements: text("approval_requirements"),
  revisionTerms: text("revision_terms"),
  usageRights: text("usage_rights"),
  exclusivityClauses: text("exclusivity_clauses"),
  latePaymentTerms: text("late_payment_terms"),
  cancellationTerms: text("cancellation_terms"),
  riskFlags: jsonb("risk_flags"),
  aiSummary: text("ai_summary"),
  rawJson: jsonb("raw_json"),
  editedByUser: boolean("edited_by_user").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ContractExtraction = typeof contractExtractionsTable.$inferSelect;
export type InsertContractExtraction = typeof contractExtractionsTable.$inferInsert;
