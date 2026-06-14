import { Router } from "express";
import { getQuestionsBatch } from "../controllers/web/questionsController";

const router = Router();

router.get("/questions/batch", getQuestionsBatch);

export default router;
