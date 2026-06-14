import "./config/env";

import path from "path";
import { execSync } from "child_process";
import app from "./app";
import { logger } from "./lib/logger";
import { env } from "./config/env";

// Parse env at startup (fail fast)
void env;

// Global error handlers for unhandled rejections/uncaught exceptions
process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ err: reason }, "Unhandled Promise rejection — server will continue");
});

process.on("uncaughtException", (err: Error) => {
  logger.error({ err }, "Uncaught exception — exiting");
  process.exit(1);
});

// Automatically sync database schema on startup in development
// if (env.NODE_ENV === "development") {
//   try {
//     logger.info("Checking and syncing database schema...");
//     // Since this is built to dist/index.mjs, __dirname is src/api-server/dist.
//     // Go up 2 levels (src/api-server/dist -> src/api-server -> workspace root) to find lib/db.
//     const dbPath = path.resolve(__dirname, "../../lib/db");
//     execSync("pnpm run push", {
//       cwd: dbPath,
//       stdio: "inherit",
//       shell: "cmd.exe",
//       env: { ...process.env },
//     });
//     logger.info("Database schema synced successfully!");
//   } catch (err) {
//     logger.error(
//       { err },
//       "Database sync failed. Please ensure your PostgreSQL connection is active and DATABASE_URL is set correctly.",
//     );
//   }
// }

app.listen(env.PORT, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: env.PORT }, "Server listening");
});
