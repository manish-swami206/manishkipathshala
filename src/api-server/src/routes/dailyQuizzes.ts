import { Router } from "express";
import { listDailyQuizzes, getDailyQuizDetail } from "../controllers/web/dailyQuizzesController";

const router = Router();

router.get("/daily-quizzes", listDailyQuizzes);
router.get("/daily-quizzes/:id", getDailyQuizDetail);

export default router;
