import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const connectedAccountsTable = pgTable("connected_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  scope: text("scope"),
  status: text("status").default("pending"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ConnectedAccount = typeof connectedAccountsTable.$inferSelect;
export type InsertConnectedAccount = typeof connectedAccountsTable.$inferInsert;
