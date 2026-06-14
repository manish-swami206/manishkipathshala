import { Router } from "express";
import { getNcertMcqQuestions, getNcertMcqSets, getNcertBooks } from "../controllers/web/ncertController";

const router = Router();

router.get("/ncert-mcq/questions", getNcertMcqQuestions);
router.get("/ncert-mcq/sets", getNcertMcqSets);
router.get("/ncert-books", getNcertBooks);

export default router;
