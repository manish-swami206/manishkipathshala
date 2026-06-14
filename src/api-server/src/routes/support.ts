import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  listMyTickets,
  getUnreadCount,
  getTicketDetail,
  createTicket,
  sendMessage,
  deleteTicket,
} from "../controllers/web/supportController";

const router = Router();

// All support routes require auth (clerkMiddleware is global in app.ts)
router.get("/support/tickets", requireAuth, listMyTickets);
router.get("/support/unread-count", requireAuth, getUnreadCount);
router.get("/support/tickets/:id", requireAuth, getTicketDetail);
router.post("/support/tickets", requireAuth, createTicket);
router.post("/support/tickets/:id/messages", requireAuth, sendMessage);
router.delete("/support/tickets/:id", requireAuth, deleteTicket);

export default router;
