import { pgTable, text, timestamp, uuid, numeric, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { invoicesTable } from "./invoices";

export const taxReservesTable = pgTable("tax_reserves", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoicesTable.id),
  grossAmount: numeric("gross_amount"),
  platformFee: numeric("platform_fee"),
  netAmount: numeric("net_amount"),
  reservePercent: integer("reserve_percent"),
  reserveAmount: numeric("reserve_amount"),
  availableBalance: numeric("available_balance"),
  period: text("period"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaxReserve = typeof taxReservesTable.$inferSelect;
export type InsertTaxReserve = typeof taxReservesTable.$inferInsert;
