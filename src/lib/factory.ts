import { createFactory } from 'hono/factory'
import type { AuthUser, AuthSessionData } from '../auth/auth'

/**
 * AppEnv defines the typed Hono context across the entire application.
 *
 * Variables are request-scoped values injected by middleware.
 * Access them via:
 *   c.get('user')     → AuthUser | null
 *   c.get('session')  → AuthSessionData | null
 *   c.var.user        → same (shorthand)
 */
export type AppEnv = {
  Variables: {
    user: AuthUser | null
    session: AuthSessionData | null
  }
}

/**
 * Shared Hono factory with AppEnv baked in.
 * Use factory.createApp(), factory.createMiddleware(), and factory.createHandlers()
 * instead of new Hono() directly to avoid repeating the generic.
 */
export const factory = createFactory<AppEnv>()
