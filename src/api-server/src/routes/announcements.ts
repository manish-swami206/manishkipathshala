import { Router } from "express";
import { listAnnouncements } from "../controllers/web/announcementsController";

const router = Router();

router.get("/announcements", listAnnouncements);

export default router;
