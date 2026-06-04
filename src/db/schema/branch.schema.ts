import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { timestamps, auditColumns } from "./_helpers";
import { statusEnum, dayOfWeekEnum } from "./enums";

// ─── Branches ─────────────────────────────────────────────────────────────────

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  address: text("address").notNull(),
  status: statusEnum("status").default("active").notNull(),
  ...timestamps,
  ...auditColumns,
});

// ─── Addresses ────────────────────────────────────────────────────────────────

export const addresses = pgTable(
  "addresses",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    address: text("address").notNull(),
    apartment: text("apartment"),
    latitude: text("latitude").notNull(),
    longitude: text("longitude").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("addresses_userId_idx").on(t.userId)],
);

// ─── Time Slots ───────────────────────────────────────────────────────────────

export const timeSlots = pgTable(
  "time_slots",
  {
    id: serial("id").primaryKey(),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    openingTime: text("opening_time").notNull(),
    closingTime: text("closing_time").notNull(),
    day: dayOfWeekEnum("day").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [index("time_slots_branchId_idx").on(t.branchId)],
);

// ─── Dining Tables ────────────────────────────────────────────────────────────

export const diningTables = pgTable(
  "dining_tables",
  {
    id: serial("id").primaryKey(),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    size: integer("size"),
    qrCode: text("qr_code"),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("dining_tables_slug_uidx").on(t.slug),
    index("dining_tables_branchId_idx").on(t.branchId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const branchRelations = relations(branches, ({ one, many }) => ({
  organization: one(organization, {
    fields: [branches.organizationId],
    references: [organization.id],
  }),
  timeSlots: many(timeSlots),
  diningTables: many(diningTables),
}));

export const addressRelations = relations(addresses, ({ one }) => ({
  user: one(user, {
    fields: [addresses.userId],
    references: [user.id],
  }),
}));

export const timeSlotRelations = relations(timeSlots, ({ one }) => ({
  branch: one(branches, {
    fields: [timeSlots.branchId],
    references: [branches.id],
  }),
}));

export const diningTableRelations = relations(diningTables, ({ one }) => ({
  branch: one(branches, {
    fields: [diningTables.branchId],
    references: [branches.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type NewTimeSlot = typeof timeSlots.$inferInsert;

export type DiningTable = typeof diningTables.$inferSelect;
export type NewDiningTable = typeof diningTables.$inferInsert;
