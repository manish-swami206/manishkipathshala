import { Router } from "express";
import { listExamSets, getExamSetBySlug } from "../controllers/web/examSetsController";

const router = Router();

router.get("/exam-sets", listExamSets);
router.get("/exam-sets/:slug", getExamSetBySlug);

export default router;
