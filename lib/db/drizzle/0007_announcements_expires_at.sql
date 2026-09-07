ALTER TABLE "announcements" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
UPDATE "announcements" SET "expires_at" = "created_at" + INTERVAL '24 hours' WHERE "expires_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_expires_at_idx" ON "announcements" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_active_expires_idx" ON "announcements" USING btree ("is_active","expires_at");
