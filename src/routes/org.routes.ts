import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../lib/factory";
import { successResponse } from "../lib/response";
import { jsonValidator, paramValidator } from "../lib/validator";
import { NotFoundError, ForbiddenError, ConflictError } from "../lib/errors";
import { orgRepository } from "../repositories/org.repository";
import { db } from "../db";
import { items, member, organization } from "../db/schema";

const orgRoutes = new Hono<AppEnv>();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const orgIdParamSchema = z.object({
  orgId: z.string().min(1),
});

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logo: z.url(),
});

const createcatSchema = z.object({
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
 * GET /api/orgs/:orgId/members
 * List all members of an organization (must be a member).
 */
orgRoutes.post(
  "/:orgId/members",
  paramValidator(orgIdParamSchema),
  jsonValidator(createcatSchema),
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
      .values({
        organizationId: itemdata.organizationId,
        itemCategoryId: itemdata.itemCategoryId,
        name: itemdata.name,
        slug: itemdata.slug,
        price: itemdata.price,
      })
      .returning({ id: items.id });
    return successResponse(c, createitems);
  },
);
export { orgRoutes };
