import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import { questionCreationLimiter } from "../../middleware/rateLimiter";
import {
  listAllQuestions,
  listQuestionIds,
  getQuestionById,
  createQuestion,
  bulkUploadQuestions,
  assignQuestions,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
} from "../../controllers/admin/questionsController";

const router = Router();

router.get("/questions", listAllQuestions);
router.get("/questions/ids", listQuestionIds);
router.get("/questions/:id", getQuestionById);
router.post("/questions", questionCreationLimiter, logAdminActivity("create_question", "question"), createQuestion);
router.post("/questions/bulk-upload", logAdminActivity("bulk_upload_questions", "question"), bulkUploadQuestions);
router.post("/questions/assign", logAdminActivity("assign_questions", "question"), assignQuestions);
router.patch("/questions/:id", logAdminActivity("update_question", "question"), updateQuestion);
router.delete("/questions/:id", logAdminActivity("delete_question", "question"), deleteQuestion);
router.post("/questions/bulk-delete", logAdminActivity("bulk_delete_questions", "question"), bulkDeleteQuestions);

export default router;
