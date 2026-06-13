import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../lib/factory";
import { successResponse } from "../lib/response";
import { jsonValidator, paramValidator } from "../lib/validator";
import { NotFoundError, ForbiddenError, ConflictError } from "../lib/errors";
import { orgRepository } from "../repositories/org.repository";
import { db } from "../db";
import { member, organization } from "../db/schema";

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
export { orgRoutes };
