import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, index } from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { timestamps, auditColumns } from "./_helpers";
import { statusEnum } from "./enums";

// ─── Menu Sections ────────────────────────────────────────────────────────────

export const menuSections = pgTable("menu_sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
  ...auditColumns,
});

// ─── Menu Templates ───────────────────────────────────────────────────────────

export const menuTemplates = pgTable("menu_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
  ...auditColumns,
});

// ─── Pages ────────────────────────────────────────────────────────────────────

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    menuSectionId: integer("menu_section_id")
      .notNull()
      .references(() => menuSections.id, { onDelete: "restrict" }),
    templateId: integer("template_id").references(() => menuTemplates.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
    ...auditColumns,
  },
  (t) => [
    index("pages_orgId_idx").on(t.organizationId),
    index("pages_menuSectionId_idx").on(t.menuSectionId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const menuSectionRelations = relations(menuSections, ({ many }) => ({
  pages: many(pages),
}));

export const menuTemplateRelations = relations(menuTemplates, ({ many }) => ({
  pages: many(pages),
}));

export const pageRelations = relations(pages, ({ one }) => ({
  organization: one(organization, {
    fields: [pages.organizationId],
    references: [organization.id],
  }),
  menuSection: one(menuSections, {
    fields: [pages.menuSectionId],
    references: [menuSections.id],
  }),
  template: one(menuTemplates, {
    fields: [pages.templateId],
    references: [menuTemplates.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type MenuSection = typeof menuSections.$inferSelect;
export type NewMenuSection = typeof menuSections.$inferInsert;

export type MenuTemplate = typeof menuTemplates.$inferSelect;
export type NewMenuTemplate = typeof menuTemplates.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
