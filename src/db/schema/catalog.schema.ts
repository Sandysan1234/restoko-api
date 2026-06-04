import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { timestamps, auditColumns, softDelete } from "./_helpers";
import { statusEnum, itemTypeEnum, taxTypeEnum } from "./enums";

// ─── Item Categories ──────────────────────────────────────────────────────────
// Merged with: 2024_03_07_095727_add_sort_to_item_categories_table

export const itemCategories = pgTable(
  "item_categories",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: statusEnum("status").default("active").notNull(),
    sort: integer("sort").default(1).notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("item_categories_orgId_idx").on(t.organizationId)],
);

// ─── Taxes ────────────────────────────────────────────────────────────────────

export const taxes = pgTable(
  "taxes",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    taxRate: numeric("tax_rate", { precision: 19, scale: 6 }).notNull(),
    type: taxTypeEnum("type").notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("taxes_orgId_idx").on(t.organizationId)],
);

// ─── Items ────────────────────────────────────────────────────────────────────

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    itemCategoryId: integer("item_category_id")
      .notNull()
      .references(() => itemCategories.id),
    taxId: integer("tax_id").references(() => taxes.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    caution: text("caution"),
    description: text("description"),
    price: numeric("price", { precision: 19, scale: 6 }).default("0").notNull(),
    status: statusEnum("status").default("active").notNull(),
    itemType: itemTypeEnum("item_type").default("veg").notNull(),
    sortOrder: integer("sort_order").default(1).notNull(),
    isFeatured: boolean("is_featured").default(true).notNull(),
    ...timestamps,
    ...auditColumns,
    ...softDelete,
  },
  (t) => [
    index("items_orgId_idx").on(t.organizationId),
    index("items_categoryId_idx").on(t.itemCategoryId),
  ],
);

// ─── Item Attributes ──────────────────────────────────────────────────────────
// Attribute types, e.g. "Size", "Color"

export const itemAttributes = pgTable(
  "item_attributes",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("item_attributes_orgId_idx").on(t.organizationId)],
);

// ─── Item Variations ──────────────────────────────────────────────────────────
// e.g. item "Pizza" → attribute "Size" → variation "Large"

export const itemVariations = pgTable(
  "item_variations",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    itemAttributeId: integer("item_attribute_id")
      .notNull()
      .references(() => itemAttributes.id),
    name: text("name").notNull(),
    price: numeric("price", { precision: 19, scale: 6 }).default("0").notNull(),
    caution: text("caution"),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
    ...softDelete,
  },
  (t) => [
    index("item_variations_itemId_idx").on(t.itemId),
    index("item_variations_attributeId_idx").on(t.itemAttributeId),
  ],
);

// ─── Item Extras ──────────────────────────────────────────────────────────────
// Optional add-ons attached directly to an item, e.g. "Extra Cheese"

export const itemExtras = pgTable(
  "item_extras",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: numeric("price", { precision: 19, scale: 6 }).notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
    ...softDelete,
  },
  (t) => [index("item_extras_itemId_idx").on(t.itemId)],
);

// ─── Item Addons ──────────────────────────────────────────────────────────────
// Cross-item addons: item A can be served with item B as an add-on

export const itemAddons = pgTable(
  "item_addons",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    addonItemId: integer("addon_item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    addonItemVariation: jsonb("addon_item_variation"),
    ...timestamps,
    ...auditColumns,
    ...softDelete,
  },
  (t) => [
    index("item_addons_itemId_idx").on(t.itemId),
    index("item_addons_addonItemId_idx").on(t.addonItemId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const itemCategoryRelations = relations(
  itemCategories,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [itemCategories.organizationId],
      references: [organization.id],
    }),
    items: many(items),
  }),
);

export const taxRelations = relations(taxes, ({ one, many }) => ({
  organization: one(organization, {
    fields: [taxes.organizationId],
    references: [organization.id],
  }),
  items: many(items),
}));

export const itemRelations = relations(items, ({ one, many }) => ({
  organization: one(organization, {
    fields: [items.organizationId],
    references: [organization.id],
  }),
  category: one(itemCategories, {
    fields: [items.itemCategoryId],
    references: [itemCategories.id],
  }),
  tax: one(taxes, {
    fields: [items.taxId],
    references: [taxes.id],
  }),
  variations: many(itemVariations),
  extras: many(itemExtras),
  addons: many(itemAddons, { relationName: "itemToAddons" }),
  addonOf: many(itemAddons, { relationName: "addonItems" }),
}));

export const itemAttributeRelations = relations(
  itemAttributes,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [itemAttributes.organizationId],
      references: [organization.id],
    }),
    variations: many(itemVariations),
  }),
);

export const itemVariationRelations = relations(itemVariations, ({ one }) => ({
  item: one(items, {
    fields: [itemVariations.itemId],
    references: [items.id],
  }),
  attribute: one(itemAttributes, {
    fields: [itemVariations.itemAttributeId],
    references: [itemAttributes.id],
  }),
}));

export const itemExtraRelations = relations(itemExtras, ({ one }) => ({
  item: one(items, {
    fields: [itemExtras.itemId],
    references: [items.id],
  }),
}));

export const itemAddonRelations = relations(itemAddons, ({ one }) => ({
  item: one(items, {
    fields: [itemAddons.itemId],
    references: [items.id],
    relationName: "itemToAddons",
  }),
  addonItem: one(items, {
    fields: [itemAddons.addonItemId],
    references: [items.id],
    relationName: "addonItems",
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ItemCategory = typeof itemCategories.$inferSelect;
export type NewItemCategory = typeof itemCategories.$inferInsert;

export type Tax = typeof taxes.$inferSelect;
export type NewTax = typeof taxes.$inferInsert;

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export type ItemAttribute = typeof itemAttributes.$inferSelect;
export type NewItemAttribute = typeof itemAttributes.$inferInsert;

export type ItemVariation = typeof itemVariations.$inferSelect;
export type NewItemVariation = typeof itemVariations.$inferInsert;

export type ItemExtra = typeof itemExtras.$inferSelect;
export type NewItemExtra = typeof itemExtras.$inferInsert;

export type ItemAddon = typeof itemAddons.$inferSelect;
export type NewItemAddon = typeof itemAddons.$inferInsert;
