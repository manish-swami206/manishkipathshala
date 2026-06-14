import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../controllers/admin/announcementsController";

const router = Router();

router.get("/announcements", listAllAnnouncements);
router.get("/announcements/:id", getAnnouncement);
router.post("/announcements", logAdminActivity("create_announcement", "announcement"), createAnnouncement);
router.patch("/announcements/:id", logAdminActivity("update_announcement", "announcement"), updateAnnouncement);
router.delete("/announcements/:id", logAdminActivity("delete_announcement", "announcement"), deleteAnnouncement);

export default router;
