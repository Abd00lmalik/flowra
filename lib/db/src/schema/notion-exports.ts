import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { contractsTable } from "./contracts";

export const notionExportsTable = pgTable("notion_exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  contractId: uuid("contract_id").references(() => contractsTable.id),
  notionPageId: text("notion_page_id"),
  notionDatabaseId: text("notion_database_id"),
  exportType: text("export_type"),
  status: text("status"),
  exportedAt: timestamp("exported_at").defaultNow().notNull(),
});

export type NotionExport = typeof notionExportsTable.$inferSelect;
