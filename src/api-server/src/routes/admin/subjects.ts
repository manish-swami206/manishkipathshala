import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../controllers/admin/subjectsController";

const router = Router();

router.get("/subjects", listAllSubjects);
router.post("/subjects", logAdminActivity("create_subject", "subject"), createSubject);
router.patch("/subjects/:id", logAdminActivity("update_subject", "subject"), updateSubject);
router.delete("/subjects/:id", logAdminActivity("delete_subject", "subject"), deleteSubject);

export default router;
