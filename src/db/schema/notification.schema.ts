import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { timestamps } from "./_helpers";
import { branches } from "./branch.schema";

// ─── Notifications ────────────────────────────────────────────────────────────
// Replaces the polymorphic notifications table.
// In the new stack only users receive notifications → direct FK instead of morphs.

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    data: jsonb("data"),
    readAt: timestamp("read_at"),
    ...timestamps,
  },
  (t) => [index("notifications_userId_idx").on(t.userId)],
);

// ─── Push Notifications ───────────────────────────────────────────────────────

export const pushNotifications = pgTable(
  "push_notifications",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    role: text("role"), // target role slug, null = all roles
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // specific user
    branchId: integer("branch_id").references(() => branches.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [index("push_notifications_orgId_idx").on(t.organizationId)],
);

// ─── Notification Alerts ──────────────────────────────────────────────────────
// Notification template definitions (mail/sms/push message templates per event)

export const notificationAlerts = pgTable("notification_alerts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  language: text("language").notNull(),
  mailMessage: text("mail_message"),
  smsMessage: text("sms_message"),
  pushNotificationMessage: text("push_notification_message"),
  mail: boolean("mail"),
  sms: boolean("sms"),
  pushNotification: boolean("push_notification"),
  ...timestamps,
});

// ─── Messages ─────────────────────────────────────────────────────────────────
// Chat conversation threads between a customer and a branch

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [
    index("messages_branchId_idx").on(t.branchId),
    index("messages_userId_idx").on(t.userId),
  ],
);

// ─── Message Histories ────────────────────────────────────────────────────────
// Individual chat messages within a thread

export const messageHistories = pgTable(
  "message_histories",
  {
    id: serial("id").primaryKey(),
    messageId: integer("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    text: text("text"),
    isRead: boolean("is_read").default(false).notNull(),
    ...timestamps,
  },
  (t) => [index("message_histories_messageId_idx").on(t.messageId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

export const pushNotificationRelations = relations(
  pushNotifications,
  ({ one }) => ({
    organization: one(organization, {
      fields: [pushNotifications.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [pushNotifications.userId],
      references: [user.id],
    }),
    branch: one(branches, {
      fields: [pushNotifications.branchId],
      references: [branches.id],
    }),
  }),
);

export const messageRelations = relations(messages, ({ one, many }) => ({
  branch: one(branches, {
    fields: [messages.branchId],
    references: [branches.id],
  }),
  user: one(user, {
    fields: [messages.userId],
    references: [user.id],
  }),
  histories: many(messageHistories),
}));

export const messageHistoryRelations = relations(
  messageHistories,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageHistories.messageId],
      references: [messages.id],
    }),
    user: one(user, {
      fields: [messageHistories.userId],
      references: [user.id],
    }),
  }),
);

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type PushNotification = typeof pushNotifications.$inferSelect;
export type NewPushNotification = typeof pushNotifications.$inferInsert;

export type NotificationAlert = typeof notificationAlerts.$inferSelect;
export type NewNotificationAlert = typeof notificationAlerts.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MessageHistory = typeof messageHistories.$inferSelect;
export type NewMessageHistory = typeof messageHistories.$inferInsert;
