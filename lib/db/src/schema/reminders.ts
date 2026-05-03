import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { milestonesTable } from "./milestones";

export const remindersTable = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  milestoneId: uuid("milestone_id").references(() => milestonesTable.id).notNull(),
  type: text("type").notNull(),
  sentAt: timestamp("sent_at"),
  status: text("status").default("pending"),
});

export type Reminder = typeof remindersTable.$inferSelect;
export type InsertReminder = typeof remindersTable.$inferInsert;
