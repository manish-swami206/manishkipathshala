ALTER TABLE "student_attempts" ALTER COLUMN "quiz_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "student_attempts" ADD COLUMN "activity_type" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_tickets_is_read_by_admin_idx" ON "support_tickets" USING btree ("is_read_by_admin");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_user_attempted_idx" ON "student_attempts" USING btree ("user_id","attempted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exam_sets_medium_idx" ON "exam_sets" USING btree ("medium");