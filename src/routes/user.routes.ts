import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../lib/factory'
import { successResponse, paginatedResponse } from '../lib/response'
import { jsonValidator, paramValidator, queryValidator } from '../lib/validator'
import { NotFoundError, ForbiddenError } from '../lib/errors'
import { userRepository } from '../repositories/user.repository'

const userRoutes = new Hono<AppEnv>()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const idParamSchema = z.object({
  id: z.string().min(1),
})

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/users/me
 * Returns the currently authenticated user's profile.
 */
userRoutes.get('/me', (c) => {
  const user = c.var.user!
  return successResponse(c, user)
})

/**
 * PATCH /api/users/me
 * Update the current user's profile.
 */
userRoutes.patch('/me', jsonValidator(updateUserSchema), async (c) => {
  const currentUser = c.var.user!
  const data = c.req.valid('json')

  const updated = await userRepository.update(currentUser.id, data)
  if (!updated) throw new NotFoundError('User')

  return successResponse(c, updated)
})

/**
 * GET /api/users/:id
 * Get a user by ID. Users can only view their own profile unless they are the same user.
 */
userRoutes.get('/:id', paramValidator(idParamSchema), async (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.var.user!

  // Only allow users to view their own profile via this endpoint
  if (id !== currentUser.id) {
    throw new ForbiddenError('You can only view your own profile')
  }

  const found = await userRepository.findById(id)
  if (!found) throw new NotFoundError('User')

  return successResponse(c, found)
})

export { userRoutes }
