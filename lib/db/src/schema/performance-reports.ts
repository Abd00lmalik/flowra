import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { contractsTable } from "./contracts";

export const performanceReportsTable = pgTable("performance_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  contractId: uuid("contract_id").references(() => contractsTable.id).notNull(),
  campaignName: text("campaign_name"),
  brandName: text("brand_name"),
  reportData: jsonb("report_data"),
  complianceScore: integer("compliance_score"),
  sharedToken: text("shared_token").unique(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export type PerformanceReport = typeof performanceReportsTable.$inferSelect;
export type InsertPerformanceReport = typeof performanceReportsTable.$inferInsert;
