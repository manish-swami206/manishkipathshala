import { Router } from "express";
import { listPyp, listSyllabus } from "../controllers/web/pypController";

const router = Router();

router.get("/pyp", listPyp);
router.get("/syllabus", listSyllabus);

export default router;
