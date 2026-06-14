import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import { uploadDoc } from "../../middleware/upload";
import {
  listAllStudyNotes,
  getStudyNoteById,
  createStudyNote,
  updateStudyNote,
  deleteStudyNote,
} from "../../controllers/admin/studyNotesController";

const router = Router();

router.get("/study-notes", listAllStudyNotes);
router.get("/study-notes/:id", getStudyNoteById);
router.post("/study-notes", uploadDoc.single("file"), logAdminActivity("create_study_note", "study_note"), createStudyNote);
router.patch("/study-notes/:id", uploadDoc.single("file"), logAdminActivity("update_study_note", "study_note"), updateStudyNote);
router.delete("/study-notes/:id", logAdminActivity("delete_study_note", "study_note"), deleteStudyNote);

export default router;
