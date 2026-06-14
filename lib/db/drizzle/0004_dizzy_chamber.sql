ALTER TABLE "ncert_pdfs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pyp_pdfs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ncert_pdfs" CASCADE;--> statement-breakpoint
DROP TABLE "pyp_pdfs" CASCADE;--> statement-breakpoint
CREATE INDEX "mock_tests_question_ids_idx" ON "mock_tests" USING gin ("question_ids");--> statement-breakpoint
CREATE INDEX "daily_quizzes_question_ids_idx" ON "daily_quizzes" USING gin ("question_ids");--> statement-breakpoint
CREATE INDEX "exam_sets_question_ids_idx" ON "exam_sets" USING gin ("question_ids");--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "quiz_id";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "question_type";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "exam_label";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "chapter";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "marks";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "support_tickets" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "support_tickets" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "daily_quizzes" DROP COLUMN "created_by";