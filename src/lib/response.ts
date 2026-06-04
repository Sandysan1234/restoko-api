import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

/**
 * Standard success response
 * { success: true, data: T }
 */
export const successResponse = <T>(c: Context, data: T, status: ContentfulStatusCode = 200) => {
  return c.json({ success: true, data }, status)
}

/**
 * Paginated list response
 * { success: true, data: T[], meta: { page, limit, total } }
 */
export const paginatedResponse = <T>(
  c: Context,
  data: T[],
  meta: { page: number; limit: number; total: number },
) => {
  return c.json({ success: true, data, meta })
}

/**
 * Standard error response
 * { success: false, error: { message, details? } }
 */
export const errorResponse = (
  c: Context,
  message: string,
  status: ContentfulStatusCode = 400,
  details?: unknown,
) => {
  return c.json(
    {
      success: false,
      error: {
        message,
        ...(details !== undefined && { details }),
      },
    },
    status,
  )
}
