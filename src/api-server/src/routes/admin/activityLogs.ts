import { Router } from "express";
import { listActivityLogs, clearActivityLogs } from "../../controllers/admin/activityLogsController";

const router = Router();

router.get("/activity-logs", listActivityLogs);
router.delete("/activity-logs", clearActivityLogs);

export default router;
