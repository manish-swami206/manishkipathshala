import { Router } from "express";
import { getHealth } from "../controllers/web/healthController";

const router = Router();

router.get("/healthz", getHealth);

export default router;
