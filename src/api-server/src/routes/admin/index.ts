import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/adminMiddleware";

import dashboardRouter from "./dashboard";
import questionsRouter from "./questions";
import studentsRouter from "./students";
import analyticsRouter from "./analytics";
import activityLogsRouter from "./activityLogs";
import supportTicketsRouter from "./supportTickets";
import announcementsRouter from "./announcements";
import currentAffairsRouter from "./currentAffairs";
import mockTestsRouter from "./mockTests";
import studyNotesRouter from "./studyNotes";
import ncertBooksRouter from "./ncertBooks";
import subjectsRouter from "./subjects";
import syllabusRouter from "./syllabus";
import dailyQuizRouter from "./dailyQuiz";
import examSetsRouter from "./examSets";
import pypRouter from "./pyp";

const router = Router();

// All admin routes require Clerk auth + admin role
// clerkMiddleware is applied globally in app.ts
router.use(requireAuth);
router.use(requireAdmin);

router.use(dashboardRouter);
router.use(questionsRouter);
router.use(studentsRouter);
router.use(analyticsRouter);
router.use(activityLogsRouter);
router.use(supportTicketsRouter);
router.use(announcementsRouter);
router.use(currentAffairsRouter);
router.use(mockTestsRouter);
router.use(studyNotesRouter);
router.use(ncertBooksRouter);
router.use(subjectsRouter);
router.use(syllabusRouter);
router.use(dailyQuizRouter);
router.use(examSetsRouter);
router.use(pypRouter);

export default router;
