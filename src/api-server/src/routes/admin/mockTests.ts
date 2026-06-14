import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllMockTests,
  getMockTestById,
  createMockTest,
  updateMockTest,
  deleteMockTest,
} from "../../controllers/admin/mockTestsController";

const router = Router();

router.get("/mock-tests", listAllMockTests);
router.get("/mock-tests/:id", getMockTestById);
router.post("/mock-tests", logAdminActivity("create_mock_test", "mock_test"), createMockTest);
router.patch("/mock-tests/:id", logAdminActivity("update_mock_test", "mock_test"), updateMockTest);
router.delete("/mock-tests/:id", logAdminActivity("delete_mock_test", "mock_test"), deleteMockTest);

export default router;
