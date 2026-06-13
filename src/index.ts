import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { factory } from "./lib/factory";
import { ValidationError } from "./lib/errors";
import { authMiddleware } from "./middleware/auth.middleware";
import { authRoutes } from "./routes/auth.routes";
import { userRoutes } from "./routes/user.routes";
import { orgRoutes } from "./routes/org.routes";
import { env } from "./env";
import { catalogRoutes } from "./routes/catalog.routes";

const app = factory.createApp();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(logger());
app.use(requestId());
app.use(secureHeaders());
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin, // reflect origin for dev; restrict in production
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// ─── Public Routes ────────────────────────────────────────────────────────────

// Health check
app.get("/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      environtment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// Better Auth — handles /api/auth/* (sign in, sign up, OAuth, etc.)
app.route("/api/auth", authRoutes);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// Apply auth middleware to all /api/users/* and /api/orgs/* routes
app.use("/api/users/*", authMiddleware);
app.use("/api/orgs/*", authMiddleware);
app.use("/api/catalog/*", authMiddleware);

app.route("/api/users", userRoutes);
app.route("/api/orgs", orgRoutes);
app.route("/api/catalog", catalogRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: { message: `Route not found: ${c.req.method} ${c.req.path}` },
    },
    404,
  );
});

app.onError((err, c) => {
  // Known HTTP exceptions (our custom classes + HTTPException)
  if (err instanceof HTTPException) {
    const status = err.status;
    return c.json(
      {
        success: false,
        error: {
          message: err.message,
          ...(err instanceof ValidationError && { details: err.details }),
        },
      },
      status,
    );
  }

  // Unexpected errors — log but never leak internals
  console.error(`[ERROR] ${c.req.method} ${c.req.path}`, err);
  return c.json(
    { success: false, error: { message: "Internal Server Error" } },
    500,
  );
});

export default app;
