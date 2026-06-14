import { Router } from "express";
import { uploadDoc } from "../../middleware/upload";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllNcertBooks,
  getNcertBookById,
  createNcertBook,
  updateNcertBook,
  deleteNcertBook,
} from "../../controllers/admin/ncertBooksController";

const router = Router();

router.get("/ncert-books", listAllNcertBooks);
router.get("/ncert-books/:id", getNcertBookById);
router.post("/ncert-books", uploadDoc.single("file"), logAdminActivity("create_ncert_book", "ncert_book"), createNcertBook);
router.patch("/ncert-books/:id", uploadDoc.single("file"), logAdminActivity("update_ncert_book", "ncert_book"), updateNcertBook);
router.delete("/ncert-books/:id", logAdminActivity("delete_ncert_book", "ncert_book"), deleteNcertBook);

export default router;
