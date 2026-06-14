import { Router } from "express";
import { getStats } from "../controllers/web/statsController";

const router = Router();

router.get("/stats", getStats);

export default router;
