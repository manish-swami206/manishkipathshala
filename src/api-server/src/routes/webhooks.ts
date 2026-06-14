import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { userStreaksTable, activityLogsTable } from "@workspace/db";

const router = Router();

// POST /webhooks/clerk — Clerk webhook endpoint
// NOTE: This router is mounted in app.ts BEFORE the global express.json() parser,
// using express.raw({ type: "application/json" }) for raw body access.
router.post(
  "/webhooks/clerk",
  async (req: Request, res: Response) => {
    try {
      const secret = process.env.CLERK_WEBHOOK_SECRET;
      if (!secret) {
        console.warn("CLERK_WEBHOOK_SECRET not set — skipping webhook");
        return res.status(200).json({ skipped: true });
      }

      // Verify webhook secret via header
      const headerSecret = req.headers["x-webhook-secret"] as string;
      if (headerSecret !== secret) {
        return res.status(401).json({ error: "Invalid webhook secret" });
      }

      const payload = req.body as {
        type: string;
        data: Record<string, unknown>;
      };
      type ClerkData = { [key: string]: unknown };
      const eventType = payload.type;
      const data = payload.data;

      switch (eventType) {
        case "user.created": {
          const { id, first_name, last_name, email_addresses } = data as ClerkData;
          const clerkUserId = id as string;
          const displayName = [first_name, last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "Learner";
          const email = (email_addresses as Array<{ email_address: string }> | undefined)?.[0]?.email_address ?? "";

          // Create streak record for new user
          const existing = await db
            .select()
            .from(userStreaksTable)
            .where(eq(userStreaksTable.userId, clerkUserId));

          if (existing.length === 0) {
            await db.insert(userStreaksTable).values({
              userId: clerkUserId,
              displayName,
              currentStreak: 1,
              longestStreak: 1,
              totalPoints: 0,
              quizCount: 0,
              mockCount: 0,
              pyqCount: 0,
              lastActivityDate: new Date().toISOString().split("T")[0],
            });
          }

          // Log signup activity
          await db.insert(activityLogsTable).values({
            userId: clerkUserId,
            action: "user.created",
            entityType: "user",
            entityId: clerkUserId,
            details: { email, displayName },
          });

          console.log(`Webhook: user.created -> ${clerkUserId} (${displayName})`);
          break;
        }

        case "user.updated": {
          const { id, first_name, last_name } = data as ClerkData;
          const clerkUserId = id as string;
          const displayName = [first_name, last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "Learner";

          await db
            .update(userStreaksTable)
            .set({ displayName, updatedAt: new Date() })
            .where(eq(userStreaksTable.userId, clerkUserId));

          console.log(`Webhook: user.updated -> ${clerkUserId}`);
          break;
        }

        case "session.created": {
          const { user_id } = data as ClerkData;
          const sessionUserId = user_id as string;
          if (sessionUserId) {
            await db.insert(activityLogsTable).values({
              userId: sessionUserId,
              action: "session.created",
              entityType: "session",
              entityId: sessionUserId,
            });
          }
          break;
        }

        default:
          console.log(`Webhook: unhandled event ${eventType}`);
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(400).json({ error: "Webhook processing failed" });
    }
  },
);

export default router;
