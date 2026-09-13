import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { userStreaksTable, activityLogsTable, studentAttemptsTable, supportTicketsTable } from "@workspace/db";
import { withWebhookRetry } from "../lib/webhookRetry";

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

          // Respond immediately — process DB writes async so Clerk doesn't
          // timeout waiting for our response (Clerk webhook timeout is ~10s).
          res.json({ success: true });

          // Fire-and-forget with retry: create streak record + log activity
          withWebhookRetry(
            async () => {
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

              await db.insert(activityLogsTable).values({
                userId: clerkUserId,
                action: "user.created",
                entityType: "user",
                entityId: clerkUserId,
                details: { email, displayName },
              });

              console.log(`Webhook: user.created -> ${clerkUserId} (${displayName})`);
            },
            { label: `user.created:${clerkUserId}` },
          );

          return; // Already sent response above
        }

        case "user.updated": {
          const { id, first_name, last_name } = data as ClerkData;
          const clerkUserId = id as string;
          const displayName = [first_name, last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "Learner";

          // Respond immediately — process async
          res.json({ success: true });

          withWebhookRetry(
            async () => {
              await db
                .update(userStreaksTable)
                .set({ displayName, updatedAt: new Date() })
                .where(eq(userStreaksTable.userId, clerkUserId));
              console.log(`Webhook: user.updated -> ${clerkUserId}`);
            },
            { label: `user.updated:${clerkUserId}` },
          );

          return;
        }

        case "session.created": {
          const { user_id } = data as ClerkData;
          const sessionUserId = user_id as string;
          if (sessionUserId) {
            // Respond immediately — process async
            res.json({ success: true });

            withWebhookRetry(
              async () => {
                await db.insert(activityLogsTable).values({
                  userId: sessionUserId,
                  action: "session.created",
                  entityType: "session",
                  entityId: sessionUserId,
                });
              },
              { label: `session.created:${sessionUserId}` },
            );

            return;
          }
          break;
        }

        case "user.deleted": {
          const { id } = data as ClerkData;
          const deletedUserId = id as string;
          if (deletedUserId) {
            // Respond immediately — clean up DB records async
            res.json({ success: true });

            withWebhookRetry(
              async () => {
                // Delete in FK order: support tickets cascade, then others
                await db.delete(supportTicketsTable).where(eq(supportTicketsTable.userId, deletedUserId));
                await db.delete(activityLogsTable).where(eq(activityLogsTable.userId, deletedUserId));
                await db.delete(studentAttemptsTable).where(eq(studentAttemptsTable.userId, deletedUserId));
                await db.delete(userStreaksTable).where(eq(userStreaksTable.userId, deletedUserId));
                console.log(`Webhook: user.deleted -> ${deletedUserId} (DB cleanup done)`);
              },
              { label: `user.deleted:${deletedUserId}` },
            );

            return;
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
