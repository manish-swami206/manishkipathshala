import { Router } from "express";
import { logAdminActivity } from "../../middleware/adminMiddleware";
import {
  listAllSupportTickets,
  getSupportTicketsUnreadCount,
  getSupportTicketDetail,
  replyToSupportTicket,
  updateSupportTicketStatus,
  assignSupportTicket,
} from "../../controllers/admin/supportTicketsController";

const router = Router();

router.get("/support-tickets", listAllSupportTickets);
router.get("/support-tickets/unread-count", getSupportTicketsUnreadCount);
router.get("/support-tickets/:id", getSupportTicketDetail);
router.post("/support-tickets/:id/replies", logAdminActivity("reply_support_ticket", "support_ticket"), replyToSupportTicket);
router.patch("/support-tickets/:id/status", logAdminActivity("update_support_ticket_status", "support_ticket"), updateSupportTicketStatus);
router.patch("/support-tickets/:id/assign", logAdminActivity("assign_support_ticket", "support_ticket"), assignSupportTicket);

export default router;
