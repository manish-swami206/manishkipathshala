import { Router } from "express";
import { listStudyNotes } from "../controllers/web/studyNotesController";

const router = Router();

router.get("/study-notes", listStudyNotes);

export default router;
