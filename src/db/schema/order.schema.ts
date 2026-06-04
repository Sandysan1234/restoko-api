import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { timestamps, auditColumns } from "./_helpers";
import {
  orderTypeEnum,
  orderStatusEnum,
  paymentStatusEnum,
  paymentMethodEnum,
  taxTypeEnum,
} from "./enums";
import { branches } from "./branch.schema";
import { items } from "./catalog.schema";
import { diningTables } from "./branch.schema";

// ─── Orders ───────────────────────────────────────────────────────────────────
// Merged with the following alter-table migrations:
//   2023_07_20_095727  → total_tax
//   2023_11_18_154743  → dining_table_id
//   2024_10_28_000000  → pos_payment_method, pos_payment_note
//   2025_02_09_000000  → pos_received_amount

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    orderSerialNo: text("order_serial_no"),
    token: text("token"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),

    // Pricing
    subtotal: numeric("subtotal", { precision: 19, scale: 6 }).notNull(),
    discount: numeric("discount", { precision: 19, scale: 6 }).default("0"),
    deliveryCharge: numeric("delivery_charge", {
      precision: 19,
      scale: 6,
    }).default("0"),
    totalTax: numeric("total_tax", { precision: 19, scale: 6 }), // added 2023-07
    total: numeric("total", { precision: 19, scale: 6 }).notNull(),

    // Order logistics
    orderType: orderTypeEnum("order_type").default("delivery").notNull(),
    orderDatetime: timestamp("order_datetime").defaultNow().notNull(),
    deliveryTime: text("delivery_time"),
    preparationTime: integer("preparation_time").default(0).notNull(),
    isAdvanceOrder: boolean("is_advance_order").default(true).notNull(),

    // Payment
    paymentMethod: paymentMethodEnum("payment_method")
      .default("cash_on_delivery")
      .notNull(),
    posPaymentMethod: paymentMethodEnum("pos_payment_method"), // added 2024-10
    posReceivedAmount: numeric("pos_received_amount", {
      precision: 19,
      scale: 6,
    }).default("0"), // added 2025-02
    posPaymentNote: text("pos_payment_note"), // added 2024-10
    paymentStatus: paymentStatusEnum("payment_status")
      .default("unpaid")
      .notNull(),

    // Status & routing
    status: orderStatusEnum("status").notNull(),
    diningTableId: integer("dining_table_id").references(
      () => diningTables.id,
      { onDelete: "set null" },
    ), // added 2023-11
    deliveryBoyId: text("delivery_boy_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reason: text("reason"),
    source: text("source"),

    ...timestamps,
    ...auditColumns,
  },
  (t) => [
    index("orders_orgId_idx").on(t.organizationId),
    index("orders_userId_idx").on(t.userId),
    index("orders_branchId_idx").on(t.branchId),
    index("orders_status_idx").on(t.status),
  ],
);

// ─── Order Items ──────────────────────────────────────────────────────────────
// Merged with: 2023_07_20_095843_add_tax_to_order_items_table

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    quantity: integer("quantity").default(1).notNull(),
    discount: numeric("discount", { precision: 19, scale: 6 }).notNull(),
    price: numeric("price", { precision: 19, scale: 6 }).notNull(),

    // Tax snapshot (captured at order time) — added 2023-07
    taxName: text("tax_name"),
    taxRate: numeric("tax_rate", { precision: 19, scale: 6 }),
    taxType: taxTypeEnum("tax_type"),
    taxAmount: numeric("tax_amount", { precision: 19, scale: 6 }),

    // Variation/extra snapshots (JSON strings for historical accuracy)
    itemVariations: text("item_variations"),
    itemExtras: text("item_extras"),
    itemVariationTotal: numeric("item_variation_total", {
      precision: 19,
      scale: 6,
    }).default("0"),
    itemExtraTotal: numeric("item_extra_total", {
      precision: 19,
      scale: 6,
    }).default("0"),
    totalPrice: numeric("total_price", { precision: 19, scale: 6 }).default(
      "0",
    ),
    instruction: text("instruction"),

    ...timestamps,
    ...auditColumns,
  },
  (t) => [
    index("order_items_orderId_idx").on(t.orderId),
    index("order_items_itemId_idx").on(t.itemId),
  ],
);

// ─── Order Addresses ──────────────────────────────────────────────────────────
// Delivery address snapshot captured at order time

export const orderAddresses = pgTable(
  "order_addresses",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
    address: text("address").notNull(),
    apartment: text("apartment"),
    latitude: text("latitude").notNull(),
    longitude: text("longitude").notNull(),
    ...timestamps,
  },
  (t) => [index("order_addresses_orderId_idx").on(t.orderId)],
);

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    sign: text("sign").default("+").notNull(),
    transactionNo: text("transaction_no").notNull(),
    amount: numeric("amount", { precision: 19, scale: 6 })
      .default("0")
      .notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    type: text("type").default("payment").notNull(),
    ...timestamps,
  },
  (t) => [index("transactions_orderId_idx").on(t.orderId)],
);

// ─── Capture Payment Notifications ────────────────────────────────────────────
// Lightweight webhook capture table for payment callbacks

export const capturePaymentNotifications = pgTable(
  "capture_payment_notifications",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("capture_payment_notif_orderId_idx").on(t.orderId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const orderRelations = relations(orders, ({ one, many }) => ({
  organization: one(organization, {
    fields: [orders.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  diningTable: one(diningTables, {
    fields: [orders.diningTableId],
    references: [diningTables.id],
  }),
  items: many(orderItems),
  address: many(orderAddresses),
  transactions: many(transactions),
  captureNotifications: many(capturePaymentNotifications),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  item: one(items, {
    fields: [orderItems.itemId],
    references: [items.id],
  }),
  branch: one(branches, {
    fields: [orderItems.branchId],
    references: [branches.id],
  }),
}));

export const orderAddressRelations = relations(orderAddresses, ({ one }) => ({
  order: one(orders, {
    fields: [orderAddresses.orderId],
    references: [orders.id],
  }),
  user: one(user, {
    fields: [orderAddresses.userId],
    references: [user.id],
  }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export const capturePaymentNotificationRelations = relations(
  capturePaymentNotifications,
  ({ one }) => ({
    order: one(orders, {
      fields: [capturePaymentNotifications.orderId],
      references: [orders.id],
    }),
  }),
);

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderAddress = typeof orderAddresses.$inferSelect;
export type NewOrderAddress = typeof orderAddresses.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type CapturePaymentNotification =
  typeof capturePaymentNotifications.$inferSelect;
