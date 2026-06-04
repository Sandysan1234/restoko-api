import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../lib/factory'
import { successResponse } from '../lib/response'
import { paramValidator } from '../lib/validator'
import { NotFoundError, ForbiddenError } from '../lib/errors'
import { orgRepository } from '../repositories/org.repository'

const orgRoutes = new Hono<AppEnv>()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const orgIdParamSchema = z.object({
  orgId: z.string().min(1),
})

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/orgs
 * List all organizations the current user belongs to.
 */
orgRoutes.get('/', async (c) => {
  const user = c.var.user!
  const orgs = await orgRepository.findByUserId(user.id)
  return successResponse(c, orgs)
})

/**
 * GET /api/orgs/:orgId
 * Get an organization by ID (must be a member).
 */
orgRoutes.get('/:orgId', paramValidator(orgIdParamSchema), async (c) => {
  const { orgId } = c.req.valid('param')
  const user = c.var.user!

  const org = await orgRepository.findById(orgId)
  if (!org) throw new NotFoundError('Organization')

  // Verify user is a member
  const membership = await orgRepository.findMember(orgId, user.id)
  if (!membership) throw new ForbiddenError('You are not a member of this organization')

  return successResponse(c, org)
})

/**
 * GET /api/orgs/:orgId/members
 * List all members of an organization (must be a member).
 */
orgRoutes.get('/:orgId/members', paramValidator(orgIdParamSchema), async (c) => {
  const { orgId } = c.req.valid('param')
  const user = c.var.user!

  const org = await orgRepository.findById(orgId)
  if (!org) throw new NotFoundError('Organization')

  // Verify user is a member
  const membership = await orgRepository.findMember(orgId, user.id)
  if (!membership) throw new ForbiddenError('You are not a member of this organization')

  const members = await orgRepository.findMembers(orgId)
  return successResponse(c, members)
})

/**
 * GET /api/orgs/:orgId/invitations
 * List pending invitations for an organization (must be a member).
 */
orgRoutes.get('/:orgId/invitations', paramValidator(orgIdParamSchema), async (c) => {
  const { orgId } = c.req.valid('param')
  const user = c.var.user!

  const org = await orgRepository.findById(orgId)
  if (!org) throw new NotFoundError('Organization')

  // Verify user is a member
  const membership = await orgRepository.findMember(orgId, user.id)
  if (!membership) throw new ForbiddenError('You are not a member of this organization')

  const invitations = await orgRepository.findInvitations(orgId)
  return successResponse(c, invitations)
})

export { orgRoutes }
