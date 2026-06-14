import { Router } from "express";
import { listMockTests, getMockTestDetail } from "../controllers/web/mockTestsController";

const router = Router();

router.get("/mock-tests", listMockTests);
router.get("/mock-tests/:id", getMockTestDetail);

export default router;
