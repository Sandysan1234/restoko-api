import { timestamp, text } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

/**
 * Standard created_at / updated_at columns.
 * Spread into any pgTable definition.
 */
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

/**
 * Audit trail columns referencing the user who created / last updated a row.
 * Replaces the Laravel polymorphic creator_type/creator_id/editor_type/editor_id pattern.
 */
export const auditColumns = {
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedBy: text("updated_by").references(() => user.id, {
    onDelete: "set null",
  }),
};

/**
 * Soft-delete column.
 * A non-null deletedAt means the row is soft-deleted.
 */
export const softDelete = {
  deletedAt: timestamp("deleted_at"),
};
