import { pgEnum } from "drizzle-orm/pg-core";

// Entity status (active / inactive)
export const statusEnum = pgEnum("status", ["active", "inactive"]);

// Order lifecycle
export const orderTypeEnum = pgEnum("order_type", [
  "delivery",
  "pickup",
  "dine_in",
  "drive_thru",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "canceled",
  "rejected",
  "returned",
]);

// Payment
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash_on_delivery",
  "e_wallet",
  "paypal",
  "stripe",
  "bank_transfer",
  "credit_card",
  "pos_cash",
  "pos_card",
  "pos_qris",
]);

// Catalog
export const itemTypeEnum = pgEnum("item_type", ["veg", "non_veg"]);

// Tax
export const taxTypeEnum = pgEnum("tax_type", ["fixed", "percentage"]);

// Language direction (LTR / RTL)
export const displayModeEnum = pgEnum("display_mode", ["ltr", "rtl"]);

// Day of week for time slots
export const dayOfWeekEnum = pgEnum("day_of_week", [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

// Gateway type discriminator
export const gatewayTypeEnum = pgEnum("gateway_type", ["payment", "sms"]);
