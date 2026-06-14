ALTER TABLE "quizzes" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "quiz_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "subject_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "current_affairs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "current_affairs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "study_notes" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "study_notes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "study_notes" ALTER COLUMN "subject_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ncert_books" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ncert_books" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "previous_year_papers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "previous_year_papers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "previous_year_papers" ALTER COLUMN "subject_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "mock_tests" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "mock_tests" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "mock_tests" ALTER COLUMN "question_ids" SET DATA TYPE uuid[];--> statement-breakpoint
ALTER TABLE "mock_tests" ALTER COLUMN "question_ids" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "mock_tests" ALTER COLUMN "subject_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "support_messages" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "support_messages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "support_messages" ALTER COLUMN "ticket_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user_streaks" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_streaks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "student_attempts" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "student_attempts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "student_attempts" ALTER COLUMN "exam_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "student_attempts" ALTER COLUMN "quiz_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ncert_pdfs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ncert_pdfs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "pyp_pdfs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "pyp_pdfs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "daily_quizzes" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "daily_quizzes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "daily_quizzes" ALTER COLUMN "question_ids" SET DATA TYPE uuid[];--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "syllabus" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "syllabus" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "syllabus" ALTER COLUMN "subject_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "exam_sets" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "exam_sets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "exam_sets" ALTER COLUMN "subject_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "exam_sets" ALTER COLUMN "question_ids" SET DATA TYPE uuid[];--> statement-breakpoint
ALTER TABLE "exam_sets" ALTER COLUMN "question_ids" SET DEFAULT '{}';