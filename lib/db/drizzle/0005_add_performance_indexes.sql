CREATE INDEX "questions_subject_idx" ON "questions" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "questions_subject_id_idx" ON "questions" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "questions_difficulty_idx" ON "questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "current_affairs_published_at_idx" ON "current_affairs" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "support_messages_ticket_idx" ON "support_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_tickets_user_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_streaks_total_points_idx" ON "user_streaks" USING btree ("total_points");--> statement-breakpoint
CREATE INDEX "user_streaks_created_at_idx" ON "user_streaks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "daily_quizzes_scheduled_date_idx" ON "daily_quizzes" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "exam_sets_type_idx" ON "exam_sets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "exam_sets_subject_id_idx" ON "exam_sets" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "exam_sets_class_num_idx" ON "exam_sets" USING btree ("class_num");