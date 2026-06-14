import { Router } from "express";
import { listActivityLogs } from "../../controllers/admin/activityLogsController";

const router = Router();

router.get("/activity-logs", listActivityLogs);

export default router;
