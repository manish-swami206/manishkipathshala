import { Router } from "express";
import {
  invalidateCache,
  getCacheStatus,
} from "../../controllers/admin/cacheController";

const router = Router();

// POST /admin/cache/invalidate — invalidate cache for specific entities
router.post("/cache/invalidate", invalidateCache);

// GET /admin/cache/status — get cache status for debugging
router.get("/cache/status", getCacheStatus);

export default router;
