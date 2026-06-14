import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllDailyQuizzes,
  getDailyQuizById,
  createDailyQuiz,
  updateDailyQuiz,
  deleteDailyQuiz,
} from "../../controllers/admin/dailyQuizController";

const router = Router();

router.get("/daily-quizzes", listAllDailyQuizzes);
router.get("/daily-quizzes/:id", getDailyQuizById);
router.post("/daily-quizzes", logAdminActivity("create_daily_quiz", "daily_quiz"), createDailyQuiz);
router.patch("/daily-quizzes/:id", logAdminActivity("update_daily_quiz", "daily_quiz"), updateDailyQuiz);
router.delete("/daily-quizzes/:id", deleteDailyQuiz);

export default router;
