import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { contractsTable } from "./contracts";

export const communicationAnalysesTable = pgTable("communication_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  contractId: uuid("contract_id").references(() => contractsTable.id),
  rawInput: text("raw_input").notNull(),
  sentiment: text("sentiment"),
  urgencyLevel: text("urgency_level"),
  paymentRisk: text("payment_risk"),
  scopeCreepRisk: text("scope_creep_risk"),
  toneRecommendation: text("tone_recommendation"),
  suggestedReply: text("suggested_reply"),
  fullAnalysis: jsonb("full_analysis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CommunicationAnalysis = typeof communicationAnalysesTable.$inferSelect;
export type InsertCommunicationAnalysis = typeof communicationAnalysesTable.$inferInsert;
