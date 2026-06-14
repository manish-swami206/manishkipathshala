import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getMyStreak, recordActivity, getLeaderboard } from "../controllers/web/streaksController";

const router = Router();

// Public — no auth required (clerkMiddleware is global, but routes without requireAuth are public)
router.get("/leaderboard", getLeaderboard);

// Auth required — requireAuth checks auth state set by global clerkMiddleware
router.get("/streaks/me", requireAuth, getMyStreak);
router.post("/streaks/activity", requireAuth, recordActivity);

export default router;
