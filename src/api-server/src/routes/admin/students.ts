import { Router } from "express";
import { listAllStudents, getStudentAttempts } from "../../controllers/admin/studentsController";

const router = Router();

router.get("/students", listAllStudents);
router.get("/students/:userId/attempts", getStudentAttempts);

export default router;
