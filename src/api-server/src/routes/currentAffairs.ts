import { Router } from "express";
import {
  listCurrentAffairs,
  getCurrentAffair,
} from "../controllers/web/currentAffairsController";

const router = Router();

router.get("/current-affairs", listCurrentAffairs);
router.get("/current-affairs/:id", getCurrentAffair);

export default router;
