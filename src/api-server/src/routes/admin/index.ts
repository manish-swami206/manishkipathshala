import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/adminMiddleware";
import { strictRateLimiter } from "../../middleware/rateLimiter";

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
import cacheRouter from "./cache";

const router = Router();

// All admin routes require Clerk auth + admin role
// clerkMiddleware is applied globally in app.ts
router.use(requireAuth);
router.use(requireAdmin);

// Rate-limit write operations (POST/PATCH/DELETE) to prevent abuse
router.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") {
    strictRateLimiter(req, res, next);
    return;
  }
  next();
});

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
router.use(cacheRouter);

export default router;
