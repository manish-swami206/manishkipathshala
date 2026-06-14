import { Router } from "express";
import { getDashboardStats } from "../../controllers/admin/dashboardController";

const router = Router();

router.get("/dashboard", getDashboardStats);

export default router;
