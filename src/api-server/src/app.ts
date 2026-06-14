import express from "express";
import helmet from "helmet";
import cors from "cors";
import { clerkMiddleware, createClerkClient } from "@clerk/express";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import webhooksRouter from "./routes/webhooks";

export function createApp() {
  const app = express();

  // 1. Security headers first
  app.use(helmet());
  app.set("trust proxy", 1);

  // 2. Webhook route — must be BEFORE body parsers to get raw body
  // Only apply express.raw() to the specific webhook path, not all /api routes
  app.use(
    "/api/webhooks/clerk",
    express.raw({ type: "application/json" }),
    webhooksRouter,
  );

  // 3. Clerk auth middleware — applied globally with explicit configuration
  // This must be before routes so the auth state (req.auth) is available to all route
  // handlers. It only verifies tokens when an Authorization header is present;
  // public routes without auth headers pass through unauthenticated.
  const clerkClient = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  });
  app.use(clerkMiddleware({ clerkClient }));

  // 4. CORS — whitelist only
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // 5. Body parsing
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  // 6. Global rate limiter (lenient — per-route can be stricter)
  app.use(globalRateLimiter);

  // 7. Routes
  app.use("/api", routes);

  // 8. 404 handler
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  // 9. Central error handler — MUST be last
  app.use(errorHandler);

  return app;
}

export default createApp();
