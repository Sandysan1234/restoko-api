import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  boolean,
  numeric,
  uniqueIndex,
  unique,
} from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { timestamps, auditColumns } from "./_helpers";
import { displayModeEnum, statusEnum } from "./enums";

// ─── Currencies ───────────────────────────────────────────────────────────────

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  code: text("code").notNull(),
  isCryptocurrency: boolean("is_cryptocurrency").default(false).notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 19, scale: 6 }),
  ...timestamps,
  ...auditColumns,
});

// ─── Languages ────────────────────────────────────────────────────────────────
// Merged with: 2024_01_22_172712_add_display_mode_to_languages_table

export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  displayMode: displayModeEnum("display_mode").default("ltr").notNull(),
  status: statusEnum("status").default("active").notNull(),
  ...timestamps,
  ...auditColumns,
});

// ─── Settings ─────────────────────────────────────────────────────────────────
// Replaces Laravel's polymorphic "settingable" with organization-scoped settings.
// Null organization_id = global/system settings.

export const settings = pgTable(
  "settings",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    group: text("group"),
    key: text("key").notNull(),
    payload: text("payload").notNull(), // JSON stored as text (use jsonb if querying into JSON)
    ...timestamps,
  },
  (t) => [uniqueIndex("settings_org_key_uidx").on(t.organizationId, t.key)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const settingsRelations = relations(settings, ({ one }) => ({
  organization: one(organization, {
    fields: [settings.organizationId],
    references: [organization.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
