import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const contractsTable = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  title: text("title").notNull(),
  status: text("status").default("active").notNull(),
  originalFilename: text("original_filename"),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  rawExtractedText: text("raw_extracted_text"),
  aiProcessingStatus: text("ai_processing_status").default("pending").notNull(),
  aiError: text("ai_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Contract = typeof contractsTable.$inferSelect;
export type InsertContract = typeof contractsTable.$inferInsert;
