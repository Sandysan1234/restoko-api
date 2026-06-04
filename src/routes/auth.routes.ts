import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from '../auth/auth'
import { env } from '../env'
import type { AppEnv } from '../lib/factory'

const authRoutes = new Hono<AppEnv>()

// CORS specifically for auth routes — required for cookie-based auth from browser
authRoutes.use(
  cors({
    origin: env.BETTER_AUTH_URL,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
)

// Mount Better Auth handler — handles all /api/auth/* routes
// c.req.raw gives the standard Web Request that Better Auth expects
authRoutes.on(['GET', 'POST'], '/*', (c) => auth.handler(c.req.raw))

export { authRoutes }
