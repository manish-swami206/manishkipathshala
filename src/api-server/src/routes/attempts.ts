import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { saveAttempt, getMyAttempts } from "../controllers/web/attemptsController";

const router = Router();

// Both attempt routes require auth (clerkMiddleware is global in app.ts)
router.post("/attempts", requireAuth, saveAttempt);
router.get("/attempts/mine", requireAuth, getMyAttempts);

export default router;
