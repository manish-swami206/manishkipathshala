import { Router } from "express";
import { uploadDoc } from "../../middleware/upload";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllPyp,
  getPypById,
  createPyp,
  updatePyp,
  deletePyp,
} from "../../controllers/admin/pypController";

const uploadFields = uploadDoc.fields([
  { name: "paperFile", maxCount: 1 },
  { name: "answerKeyFile", maxCount: 1 },
]);

const router = Router();

router.get("/pyp", listAllPyp);
router.get("/pyp/:id", getPypById);
router.post("/pyp", uploadFields, logAdminActivity("create_pyp", "pyp"), createPyp);
router.patch("/pyp/:id", uploadFields, logAdminActivity("update_pyp", "pyp"), updatePyp);
router.delete("/pyp/:id", logAdminActivity("delete_pyp", "pyp"), deletePyp);

export default router;
