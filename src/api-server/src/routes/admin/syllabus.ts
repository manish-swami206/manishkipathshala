import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import { uploadDoc } from "../../middleware/upload";
import {
  listAllSyllabus,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
} from "../../controllers/admin/syllabusController";

const router = Router();

router.get("/syllabus", listAllSyllabus);
router.post("/syllabus", uploadDoc.single("file"), logAdminActivity("create_syllabus", "syllabus"), createSyllabus);
router.patch("/syllabus/:id", uploadDoc.single("file"), logAdminActivity("update_syllabus", "syllabus"), updateSyllabus);
router.delete("/syllabus/:id", logAdminActivity("delete_syllabus", "syllabus"), deleteSyllabus);

export default router;
