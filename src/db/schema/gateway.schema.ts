import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { timestamps, auditColumns } from "./_helpers";
import { statusEnum, gatewayTypeEnum } from "./enums";

// ─── Gateways ─────────────────────────────────────────────────────────────────
// Unified table replacing both payment_gateways and sms_gateways.
// The `type` discriminator column identifies the gateway category.

export const gateways = pgTable(
  "gateways",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: gatewayTypeEnum("type").notNull(),
    misc: jsonb("misc"),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [uniqueIndex("gateways_slug_uidx").on(t.slug)],
);

// ─── Gateway Options ──────────────────────────────────────────────────────────
// Replaces the polymorphic gateway_options table.
// All options now reference gateways directly via a typed FK.

export const gatewayOptions = pgTable(
  "gateway_options",
  {
    id: serial("id").primaryKey(),
    gatewayId: integer("gateway_id")
      .notNull()
      .references(() => gateways.id, { onDelete: "cascade" }),
    option: text("option").notNull(),
    value: text("value"),
    activities: jsonb("activities"),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("gateway_options_gatewayId_idx").on(t.gatewayId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const gatewayRelations = relations(gateways, ({ many }) => ({
  options: many(gatewayOptions),
}));

export const gatewayOptionRelations = relations(gatewayOptions, ({ one }) => ({
  gateway: one(gateways, {
    fields: [gatewayOptions.gatewayId],
    references: [gateways.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Gateway = typeof gateways.$inferSelect;
export type NewGateway = typeof gateways.$inferInsert;

export type GatewayOption = typeof gatewayOptions.$inferSelect;
export type NewGatewayOption = typeof gatewayOptions.$inferInsert;
