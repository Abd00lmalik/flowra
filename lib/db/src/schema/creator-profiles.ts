import { pgTable, text, timestamp, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const creatorProfilesTable = pgTable("creator_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull().unique(),
  businessName: text("business_name"),
  country: text("country"),
  defaultCurrency: text("default_currency").default("USD"),
  taxReservePercent: integer("tax_reserve_percent").default(30),
  paymentTermsDays: integer("payment_terms_days").default(30),
  niche: text("niche"),
  averageSponsorshipValue: numeric("average_sponsorship_value"),
  paystackCustomerId: text("stripe_customer_id"),
  paystackConnectedAccountId: text("stripe_connected_account_id"),
  subscriptionPlan: text("subscription_plan").default("starter"),
  subscriptionStatus: text("subscription_status"),
  paystackSubscriptionCode: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CreatorProfile = typeof creatorProfilesTable.$inferSelect;
export type InsertCreatorProfile = typeof creatorProfilesTable.$inferInsert;
