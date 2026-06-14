import { Router } from "express";
import { getAnalytics } from "../../controllers/admin/analyticsController";

const router = Router();

router.get("/analytics", getAnalytics);

export default router;
