import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { timestamps, auditColumns } from "./_helpers";
import { statusEnum } from "./enums";
import { items } from "./catalog.schema";

// ─── Offers ───────────────────────────────────────────────────────────────────

export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    amount: numeric("amount", { precision: 19, scale: 6 }).notNull(),
    status: statusEnum("status").default("active").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("offers_orgId_idx").on(t.organizationId)],
);

// ─── Offer Items ──────────────────────────────────────────────────────────────

export const offerItems = pgTable(
  "offer_items",
  {
    id: serial("id").primaryKey(),
    offerId: integer("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [
    index("offer_items_offerId_idx").on(t.offerId),
    index("offer_items_itemId_idx").on(t.itemId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const offerRelations = relations(offers, ({ one, many }) => ({
  organization: one(organization, {
    fields: [offers.organizationId],
    references: [organization.id],
  }),
  items: many(offerItems),
}));

export const offerItemRelations = relations(offerItems, ({ one }) => ({
  offer: one(offers, {
    fields: [offerItems.offerId],
    references: [offers.id],
  }),
  item: one(items, {
    fields: [offerItems.itemId],
    references: [items.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

export type OfferItem = typeof offerItems.$inferSelect;
export type NewOfferItem = typeof offerItems.$inferInsert;
