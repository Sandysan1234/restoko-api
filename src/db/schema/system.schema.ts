import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  smallint,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { timestamps, auditColumns } from "./_helpers";
import { statusEnum } from "./enums";

// ─── Media ────────────────────────────────────────────────────────────────────
// Replaces Spatie Media Library polymorphic table.
// `entity_type` is a plain string discriminator (e.g. "item", "branch", "user")
// instead of a full PHP class name.

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(), // e.g. "item", "branch", "user"
    entityId: text("entity_id").notNull(),     // stringified FK of the related entity
    uuid: text("uuid"),
    collectionName: text("collection_name").notNull(),
    name: text("name").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type"),
    disk: text("disk").notNull(),
    conversionsDisk: text("conversions_disk"),
    size: bigint("size", { mode: "number" }).notNull(),
    manipulations: jsonb("manipulations").default({}).notNull(),
    customProperties: jsonb("custom_properties").default({}).notNull(),
    generatedConversions: jsonb("generated_conversions").default({}).notNull(),
    responsiveImages: jsonb("responsive_images").default({}).notNull(),
    orderColumn: integer("order_column"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("media_uuid_uidx").on(t.uuid),
    index("media_entity_idx").on(t.entityType, t.entityId),
    index("media_order_idx").on(t.orderColumn),
  ],
);

// ─── Analytics ────────────────────────────────────────────────────────────────
// Analytics embed script groups (e.g. Google Analytics, Hotjar)

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: statusEnum("status").default("active").notNull(),
  ...timestamps,
  ...auditColumns,
});

// ─── Analytic Sections ────────────────────────────────────────────────────────

export const analyticSections = pgTable(
  "analytic_sections",
  {
    id: serial("id").primaryKey(),
    analyticId: integer("analytic_id")
      .notNull()
      .references(() => analytics.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    data: text("data").notNull(), // script/embed code
    section: smallint("section").default(5).notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("analytic_sections_analyticId_idx").on(t.analyticId)],
);

// ─── Addons ───────────────────────────────────────────────────────────────────
// Plugin / marketplace addon registry

export const addons = pgTable(
  "addons",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    version: text("version"),
    date: timestamp("date"),
    author: text("author"),
    files: jsonb("files"),
    itemId: text("item_id").notNull(),       // external marketplace item ID
    licenseCode: text("license_code").notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [uniqueIndex("addons_slug_uidx").on(t.slug)],
);

// ─── Default Access ───────────────────────────────────────────────────────────
// Maps a user to a default entity (e.g. default branch)

export const defaultAccess = pgTable(
  "default_access",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    defaultId: bigint("default_id", { mode: "number" }).notNull(),
    ...timestamps,
  },
  (t) => [index("default_access_userId_idx").on(t.userId)],
);

// ─── OTPs ─────────────────────────────────────────────────────────────────────
// Phone OTP verification codes.
// Note: consider replacing with Better Auth's built-in verification table.

export const otps = pgTable(
  "otps",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    code: text("code").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("otps_phone_idx").on(t.phone)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const analyticsRelations = relations(analytics, ({ many }) => ({
  sections: many(analyticSections),
}));

export const analyticSectionRelations = relations(
  analyticSections,
  ({ one }) => ({
    analytic: one(analytics, {
      fields: [analyticSections.analyticId],
      references: [analytics.id],
    }),
  }),
);

export const defaultAccessRelations = relations(defaultAccess, ({ one }) => ({
  user: one(user, {
    fields: [defaultAccess.userId],
    references: [user.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;

export type AnalyticSection = typeof analyticSections.$inferSelect;
export type NewAnalyticSection = typeof analyticSections.$inferInsert;

export type Addon = typeof addons.$inferSelect;
export type NewAddon = typeof addons.$inferInsert;

export type DefaultAccess = typeof defaultAccess.$inferSelect;
export type NewDefaultAccess = typeof defaultAccess.$inferInsert;

export type Otp = typeof otps.$inferSelect;
export type NewOtp = typeof otps.$inferInsert;
