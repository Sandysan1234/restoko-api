import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../lib/factory";
import { successResponse } from "../lib/response";
import { jsonValidator, paramValidator } from "../lib/validator";
import { NotFoundError, ForbiddenError, ConflictError } from "../lib/errors";
import { orgRepository } from "../repositories/org.repository";
import { db } from "../db";
import {
  branches,
  itemAttributes,
  itemCategories,
  items,
  member,
  organization,
  taxes,
} from "../db/schema";
import { and, eq } from "drizzle-orm";

const orgRoutes = new Hono<AppEnv>();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const orgIdParamSchema = z.object({
  orgId: z.string().min(1),
});
const itemIdParamSchema = z.object({
  orgId: z.string().min(1),
  itemId: z.coerce.number(),
});
const itemCatIdParamSchema = z.object({
  orgId: z.string().min(1),
  itemcatId: z.coerce.number(),
});
const itemAttributeIdParamSchema = z.object({
  orgId: z.string().min(1),
  itemAtrId: z.coerce.number(),
});
const taxesIdParamSchema = z.object({
  orgId: z.string().min(1),
  taxesId: z.coerce.number(),
});

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logo: z.url(),
});

const createItemSchema = z.object({
  organizationId: z.string(),
  itemCategoryId: z.number(),
  taxId: z.number().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  caution: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.string(),
  status: z.enum(["active", "inactive"]).default("active"),
  itemType: z.enum(["veg", "non_veg"]).default("veg"),
  sortOrder: z.number().positive().default(1),
  isFeatured: z.boolean().optional(),
});
const updateItemSchema = createItemSchema.partial();

// itemCategories

const createitemCatSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});
const updateItemCatSchema = createitemCatSchema.partial();

//itemAttributes

const createItemAttributeSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
});
const updateItemAttributeschema = createItemAttributeSchema.partial();

//taxes
const createTaxesSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  code: z.string().min(1),
  taxRate: z.string().refine((val) => !isNaN(Number(val))),
  type: z.enum(["fixed", "percentage"]),
  status: z.enum(["active", "inactive"]).default("active"),
});
const updateTaxesSchema = createTaxesSchema.partial();

const createBranchSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().min(1),
  latitude: z.string(),
  longitude: z.string(),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  address: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

const updateBranchSchema = createBranchSchema.partial();

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/orgs
 * List all organizations the current user belongs to.
 */
orgRoutes.get("/", async (c) => {
  const user = c.var.user!;
  const orgs = await orgRepository.findByUserId(user.id);
  return successResponse(c, orgs);
});

/**
 * GET /api/orgs/:orgId
 * Get an organization by ID (must be a member).
 */
orgRoutes.get("/:orgId", paramValidator(orgIdParamSchema), async (c) => {
  const { orgId } = c.req.valid("param");
  const user = c.var.user!;

  const org = await orgRepository.findById(orgId);
  if (!org) throw new NotFoundError("Organization");

  // Verify user is a member
  const membership = await orgRepository.findMember(orgId, user.id);
  if (!membership)
    throw new ForbiddenError("You are not a member of this organization");

  return successResponse(c, org);
});

/**
 * GET /api/orgs/:orgId/members
 * List all members of an organization (must be a member).
 */
orgRoutes.get(
  "/:orgId/members",
  paramValidator(orgIdParamSchema),
  async (c) => {
    const { orgId } = c.req.valid("param");
    const user = c.var.user!;

    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");

    const members = await orgRepository.findMembers(orgId);
    return successResponse(c, members);
  },
);

/**
 * GET /api/orgs/:orgId/invitations
 * List pending invitations for an organization (must be a member).
 */
orgRoutes.get(
  "/:orgId/invitations",
  paramValidator(orgIdParamSchema),
  async (c) => {
    const { orgId } = c.req.valid("param");
    const user = c.var.user!;

    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");

    const invitations = await orgRepository.findInvitations(orgId);
    return successResponse(c, invitations);
  },
);

orgRoutes.post("/", jsonValidator(createOrgSchema), async (c) => {
  const user = c.var.user!;

  const data = c.req.valid("json");
  const existtingOrg = await orgRepository.findBySlug(data.slug);
  if (existtingOrg) {
    throw new ConflictError("Organization slug already exists");
  }
  const createorg = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organization)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        createdAt: new Date(),
      })
      .returning();
    await tx.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: org.id,
      userId: user.id,
      role: "owner",
      createdAt: new Date(),
    });

    return org;
  });

  return successResponse(c, createorg, 201);
});

/**
 * POST /api/orgs/:orgId/items
 * create data items  of an organization (must be a member).
 */
orgRoutes.post(
  "/:orgId/items",
  paramValidator(orgIdParamSchema),
  jsonValidator(createItemSchema),
  async (c) => {
    const { orgId } = c.req.valid("param");
    const user = c.var.user!;
    const itemdata = c.req.valid("json");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");

    const [createitems] = await db
      .insert(items)
      .values(itemdata)
      .returning({ id: items.id });
    return successResponse(c, createitems);
  },
);

orgRoutes.get("/:orgId/items", paramValidator(orgIdParamSchema), async (c) => {
  const { orgId } = c.req.valid("param");
  const user = c.var.user!;
  const org = await orgRepository.findById(orgId);
  if (!org) throw new NotFoundError("Organization");

  const membership = await orgRepository.findMember(orgId, user.id);
  if (!membership)
    throw new ForbiddenError("You are not a member of this organization");

  const getAllItem = await db
    .select()
    .from(items)
    .where(eq(items.organizationId, orgId))
    .limit(5);
  return successResponse(c, getAllItem);
});

orgRoutes.get(
  "/:orgId/items/:itemId",
  paramValidator(itemIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");

    const [getItem] = await db
      .select()
      .from(items)
      .where(and(eq(items.organizationId, orgId), eq(items.id, itemId)));
    return successResponse(c, getItem);
  },
);

orgRoutes.patch(
  "/:orgId/items/:itemId",
  paramValidator(itemIdParamSchema),
  jsonValidator(updateItemSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership) {
      throw new ForbiddenError("you are not a member of this organization");
    }
    const itemdata = c.req.valid("json");
    const updateItemData = await db
      .update(items)
      .set(itemdata)
      .where(and(eq(items.organizationId, orgId), eq(items.id, itemId)))
      .returning({ id: items.id });

    return successResponse(c, updateItemData);
  },
);

orgRoutes.delete(
  "/:orgId/items/:itemId",
  paramValidator(itemIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("you are not a member of this organization");
    const [item] = await db
      .delete(items)
      .where(and(eq(items.organizationId, orgId), eq(items.id, itemId)))
      .returning({ id: items.id });
    return successResponse(c, item);
  },
);

//**
// CRUD categories */

orgRoutes.post(
  "/:orgId/categories",
  paramValidator(orgIdParamSchema),
  jsonValidator(createitemCatSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId } = c.req.valid("param");
    const newItemCategory = c.req.valid("json");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const itemCategory = await db
      .insert(itemCategories)
      .values(newItemCategory);
    return successResponse(c, itemCategory);
  },
);
orgRoutes.get(
  "/:orgId/categories",
  paramValidator(orgIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const categories = await db
      .select()
      .from(itemCategories)
      .where(eq(itemCategories.organizationId, orgId));
    return successResponse(c, categories);
  },
);
orgRoutes.get(
  "/:orgId/categories/:itemcatId",
  paramValidator(itemCatIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemcatId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const itemCategory = await db
      .select()
      .from(itemCategories)
      .where(
        and(
          eq(itemCategories.organizationId, orgId),
          eq(itemCategories.id, itemcatId),
        ),
      );
    return successResponse(c, itemCategory);
  },
);
orgRoutes.patch(
  "/:orgId/categories/:itemcatId",
  paramValidator(itemCatIdParamSchema),
  jsonValidator(updateItemCatSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemcatId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const itemCategoryData = c.req.valid("json");
    const itemcategory = await db
      .update(itemCategories)
      .set(itemCategoryData)
      .where(
        and(eq(itemCategories.organizationId, orgId), eq(items.id, itemcatId)),
      )
      .returning({ id: itemCategories.id });
    return successResponse(c, itemcategory);
  },
);
orgRoutes.delete(
  "/:orgId/categories/:itemcatId",
  paramValidator(itemCatIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemcatId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership) {
      throw new ForbiddenError("You are not a member of this organization");
    }
    const [itemCategory] = await db
      .delete(itemCategories)
      .where(eq(itemCategories.id, itemcatId))
      .returning({ id: itemCategories.id });
    return successResponse(c, itemCategory);
  },
);

// CRUD ATTRIBUTES

orgRoutes.post(
  "/:orgId/attributes",
  paramValidator(orgIdParamSchema),
  jsonValidator(createItemAttributeSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId } = c.req.valid("param");
    const newItemAttributes = c.req.valid("json");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const [itemAttribute] = await db
      .insert(itemAttributes)
      .values(newItemAttributes)
      .returning({ id: itemAttributes.id });
    return successResponse(c, itemAttribute);
  },
);
orgRoutes.get(
  "/:orgId/attributes",
  paramValidator(orgIdParamSchema),

  async (c) => {
    const user = c.var.user!;
    const { orgId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const itemAttribute = await db
      .select()
      .from(itemAttributes)
      .where(eq(itemAttributes.organizationId, orgId))
      .limit(5);
    return successResponse(c, itemAttribute);
  },
);
orgRoutes.get(
  "/:orgId/attributes/:itemAtrId",
  paramValidator(itemAttributeIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemAtrId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const [itemAttribute] = await db
      .select()
      .from(itemAttributes)
      .where(
        and(
          eq(itemAttributes.organizationId, orgId),
          eq(itemAttributes.id, itemAtrId),
        ),
      )
      .limit(1);
    return successResponse(c, itemAttribute);
  },
);

orgRoutes.patch(
  "/:orgId/attributes/:itemAtrId",
  paramValidator(itemAttributeIdParamSchema),
  jsonValidator(updateItemAttributeschema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemAtrId } = c.req.valid("param");
    const newItemAtrributes = c.req.valid("json");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const itemAttribute = await db
      .update(itemAttributes)
      .set(newItemAtrributes)
      .where(
        and(
          eq(itemAttributes.organizationId, orgId),
          eq(itemAttributes.id, itemAtrId),
        ),
      );
    return successResponse(c, itemAttribute);
  },
);
orgRoutes.delete(
  "/:orgId/attributes/:itemAtrId",
  paramValidator(itemAttributeIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, itemAtrId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const itemAttribute = await db
      .delete(itemAttributes)
      .where(
        and(
          eq(itemAttributes.organizationId, orgId),
          eq(itemAttributes.id, itemAtrId),
        ),
      );
    return successResponse(c, itemAttribute);
  },
);

orgRoutes.post(
  "/:orgId/taxes",
  paramValidator(orgIdParamSchema),
  jsonValidator(createTaxesSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId } = c.req.valid("param");
    const newTaxesdata = c.req.valid("json");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");

    const taxesdata = await db
      .insert(taxes)
      .values(newTaxesdata)
      .returning({ id: itemAttributes.id });
    return successResponse(c, taxesdata);
  },
);

orgRoutes.get("/:orgId/taxes", paramValidator(orgIdParamSchema), async (c) => {
  const user = c.var.user!;
  const { orgId } = c.req.valid("param");
  const org = orgRepository.findById(orgId);
  if (!org) throw new NotFoundError("Organization");

  const membership = orgRepository.findMember(orgId, user.id);
  if (!membership)
    throw new ForbiddenError("You are not a member of this organization");

  const taxesdata = await db
    .select()
    .from(taxes)
    .where(eq(taxes.organizationId, orgId));
  return successResponse(c, taxesdata);
});

orgRoutes.get(
  "/:orgId/taxes/:taxId",
  paramValidator(taxesIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, taxesId } = c.req.valid("param");
    const org = orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    const membership = orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const [taxesdata] = await db
      .select()
      .from(taxes)
      .where(and(eq(taxes.organizationId, orgId), eq(taxes.id, taxesId)));
    return successResponse(c, taxesdata);
  },
);

orgRoutes.patch(
  "/:orgId/taxes/:taxId",
  paramValidator(taxesIdParamSchema),
  jsonValidator(updateTaxesSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, taxesId } = c.req.valid("param");
    const updateTaxes = c.req.valid("json");
    const org = orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    const membership = orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");

    const taxesdata = await db
      .update(taxes)
      .set(updateTaxes)
      .where(and(eq(taxes.organizationId, orgId), eq(taxes.id, taxesId)))
      .returning();
    return successResponse(c, taxesdata);
  },
);

orgRoutes.delete(
  "/:orgId/taxes/:taxId",
  paramValidator(taxesIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId, taxesId } = c.req.valid("param");

    const org = orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    const membership = orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");
    const taxesdata = await db
      .delete(taxes)
      .where(and(eq(taxes.organizationId, orgId), eq(taxes.id, taxesId)))
      .returning({ id: taxes.id });
    return successResponse(c, taxesdata);
  },
);

orgRoutes.post(
  "/:orgId/branches",
  paramValidator(orgIdParamSchema),
  jsonValidator(createBranchSchema),
  async (c) => {
    const user = c.var.user!;
    const { orgId } = c.req.valid("param");
    const org = await orgRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization");

    // Verify user is a member
    const membership = await orgRepository.findMember(orgId, user.id);
    if (!membership)
      throw new ForbiddenError("You are not a member of this organization");

    const newBranchData = c.req.valid("json");
    const branchData = await db
      .insert(branches)
      .values(newBranchData)
      .returning({ id: branches.id });
    return successResponse(c, branchData);
  },
);

export { orgRoutes };
