import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllCurrentAffairs,
  getCurrentAffairById,
  createCurrentAffairAdmin,
  updateCurrentAffairAdmin,
  deleteCurrentAffairAdmin,
} from "../../controllers/admin/currentAffairsController";

const router = Router();

router.get("/current-affairs", listAllCurrentAffairs);
router.get("/current-affairs/:id", getCurrentAffairById);
router.post(
  "/current-affairs",
  logAdminActivity("create_current_affair", "current_affair"),
  createCurrentAffairAdmin,
);
router.patch(
  "/current-affairs/:id",
  logAdminActivity("update_current_affair", "current_affair"),
  updateCurrentAffairAdmin,
);
router.delete(
  "/current-affairs/:id",
  logAdminActivity("delete_current_affair", "current_affair"),
  deleteCurrentAffairAdmin,
);

export default router;
