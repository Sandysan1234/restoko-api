import { factory } from '../lib/factory'
import { auth } from '../auth/auth'

/**
 * Resolves the current session from either:
 *   - A session cookie (browser clients)
 *   - Authorization: Bearer <session-token> header (API clients)
 *
 * Sets `user` and `session` on the Hono context.
 * Returns 401 if no valid session is found.
 */
export const authMiddleware = factory.createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json(
      { success: false, error: { message: 'Unauthorized' } },
      401,
    )
  }

  c.set('user', session.user)
  c.set('session', session.session)

  return next()
})

/**
 * Optional session resolver — does NOT return 401.
 * Use on routes that are public but optionally personalized.
 *
 * Sets user/session if available, sets null otherwise.
 */
export const optionalAuthMiddleware = factory.createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)

  return next()
})
