import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

/**
 * Typed request validator with consistent 422 error format.
 * Wraps @hono/zod-validator with the standard error envelope.
 *
 * Usage:
 *   app.post('/users', jsonValidator(createUserSchema), (c) => {
 *     const data = c.req.valid('json') // fully typed
 *   })
 */
export const jsonValidator = <T extends z.ZodType>(schema: T) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            details: result.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        422,
      )
    }
  })

export const queryValidator = <T extends z.ZodType>(schema: T) =>
  zValidator('query', schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Invalid query parameters',
            details: result.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        422,
      )
    }
  })

export const paramValidator = <T extends z.ZodType>(schema: T) =>
  zValidator('param', schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Invalid path parameters',
            details: result.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        422,
      )
    }
  })
