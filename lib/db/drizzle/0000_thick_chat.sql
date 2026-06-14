CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer,
	"subject_id" integer,
	"pyq_subject_id" integer,
	"class_num" integer,
	"subject" text,
	"medium" text,
	"type" text DEFAULT 'quiz' NOT NULL,
	"question_type" text DEFAULT 'single',
	"text" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text,
	"exam_label" text,
	"difficulty" text DEFAULT 'medium',
	"chapter" text,
	"tags" text,
	"marks" real DEFAULT 1,
	"negative_marks" real DEFAULT 0,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"duration_mins" integer DEFAULT 10 NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"negative_marking" real DEFAULT 0.25 NOT NULL,
	"status" text DEFAULT 'ongoing' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_affairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"subject" text NOT NULL,
	"medium" text DEFAULT 'English' NOT NULL,
	"url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncert_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"class_num" integer NOT NULL,
	"subject" text NOT NULL,
	"medium" text DEFAULT 'English' NOT NULL,
	"read_url" text,
	"download_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "previous_year_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_name" text NOT NULL,
	"shift_name" text NOT NULL,
	"year" integer NOT NULL,
	"subject" text,
	"subject_id" integer,
	"question_paper_url" text,
	"answer_key_url" text,
	"answer_key_pdf" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"duration_mins" integer DEFAULT 60 NOT NULL,
	"question_count" integer DEFAULT 100 NOT NULL,
	"max_marks" integer DEFAULT 100 NOT NULL,
	"negative_marking" real DEFAULT 0.25 NOT NULL,
	"question_ids" integer[] DEFAULT '{}' NOT NULL,
	"subject_id" integer,
	"difficulty" text DEFAULT 'medium',
	"class" integer,
	"medium" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer,
	"message" text NOT NULL,
	"sender" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"assigned_to" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"user_deleted_at" timestamp,
	"is_read_by_user" boolean DEFAULT true NOT NULL,
	"is_read_by_admin" boolean DEFAULT true NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"type" text DEFAULT 'info' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"link_text" text,
	"link_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text DEFAULT 'Learner' NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"quiz_count" integer DEFAULT 0 NOT NULL,
	"mock_count" integer DEFAULT 0 NOT NULL,
	"pyq_count" integer DEFAULT 0 NOT NULL,
	"last_activity_date" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"order_num" integer DEFAULT 0 NOT NULL,
	"marks" real DEFAULT 1 NOT NULL,
	"negative_marks" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"subject" text NOT NULL,
	"duration_mins" integer DEFAULT 60 NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"passing_marks" integer DEFAULT 40 NOT NULL,
	"negative_marking" real DEFAULT 0 NOT NULL,
	"instructions" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"category" text,
	"created_by" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exam_id" integer,
	"quiz_id" integer,
	"score" real DEFAULT 0 NOT NULL,
	"total_marks" real DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"wrong_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"time_taken_secs" integer DEFAULT 0 NOT NULL,
	"is_passed" boolean DEFAULT false NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncert_pdfs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"class_number" integer NOT NULL,
	"original_name" text NOT NULL,
	"cloudinary_url" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pyp_pdfs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"year" integer NOT NULL,
	"exam_type" text NOT NULL,
	"original_name" text NOT NULL,
	"cloudinary_url" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_date" date NOT NULL,
	"scheduled_time" time NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"total_questions" integer NOT NULL,
	"question_ids" integer[] NOT NULL,
	"is_published" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"exam_category" text DEFAULT 'General',
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "syllabus" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject_id" integer,
	"description" text,
	"exam_category" text,
	"read_url" text,
	"download_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'pyq' NOT NULL,
	"subject_id" integer,
	"class_num" integer,
	"medium" text,
	"question_ids" integer[] DEFAULT '{}' NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sets" ADD CONSTRAINT "exam_sets_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_action_idx" ON "activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "exam_questions_exam_idx" ON "exam_questions" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exams_status_idx" ON "exams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exams_subject_idx" ON "exams" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "attempts_user_idx" ON "student_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attempts_exam_idx" ON "student_attempts" USING btree ("exam_id");