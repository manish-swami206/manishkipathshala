import { Router } from "express";
import { listSubjects } from "../controllers/web/subjectsController";

const router = Router();

router.get("/subjects", listSubjects);

export default router;
