import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllExamSets,
  getExamSetById,
  createExamSet,
  updateExamSet,
  deleteExamSet,
} from "../../controllers/admin/examSetsController";

const router = Router();

router.get("/exam-sets", listAllExamSets);
router.get("/exam-sets/:id", getExamSetById);
router.post("/exam-sets", logAdminActivity("create_exam_set", "exam_set"), createExamSet);
router.patch("/exam-sets/:id", logAdminActivity("update_exam_set", "exam_set"), updateExamSet);
router.delete("/exam-sets/:id", logAdminActivity("delete_exam_set", "exam_set"), deleteExamSet);

export default router;
