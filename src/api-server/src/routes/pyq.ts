import { Router } from "express";
import { getPyqSubjects, getPyqSets, getPyqQuestions } from "../controllers/web/pyqController";

const router = Router();

router.get("/pyq/subjects", getPyqSubjects);
router.get("/pyq/sets", getPyqSets);
router.get("/pyq/questions", getPyqQuestions);

export default router;
