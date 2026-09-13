import { Router } from "express";
import { listAllStudents, getStudentAttempts, deleteStudent } from "../../controllers/admin/studentsController";

const router = Router();

router.get("/students", listAllStudents);
router.get("/students/:userId/attempts", getStudentAttempts);
router.delete("/students/:userId", deleteStudent);

export default router;
