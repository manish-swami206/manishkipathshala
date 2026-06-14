ALTER TABLE "exam_questions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "exams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "exam_questions" CASCADE;--> statement-breakpoint
DROP TABLE "exams" CASCADE;--> statement-breakpoint
ALTER TABLE "current_affairs" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_sets" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "pyq_subject_id";--> statement-breakpoint
ALTER TABLE "current_affairs" ADD CONSTRAINT "current_affairs_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "exam_sets" ADD CONSTRAINT "exam_sets_slug_unique" UNIQUE("slug");