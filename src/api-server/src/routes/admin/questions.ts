import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import { questionCreationLimiter } from "../../middleware/rateLimiter";
import {
  listAllQuestions,
  getQuestionById,
  createQuestion,
  bulkUploadQuestions,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
} from "../../controllers/admin/questionsController";

const router = Router();

router.get("/questions", listAllQuestions);
router.get("/questions/:id", getQuestionById);
router.post("/questions", questionCreationLimiter, logAdminActivity("create_question", "question"), createQuestion);
router.post("/questions/bulk-upload", logAdminActivity("bulk_upload_questions", "question"), bulkUploadQuestions);
router.patch("/questions/:id", logAdminActivity("update_question", "question"), updateQuestion);
router.delete("/questions/:id", logAdminActivity("delete_question", "question"), deleteQuestion);
router.post("/questions/bulk-delete", logAdminActivity("bulk_delete_questions", "question"), bulkDeleteQuestions);

export default router;
