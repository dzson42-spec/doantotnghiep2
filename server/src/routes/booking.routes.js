import { Router } from "express";
import {
  cancelBooking,
  claimBooking,
  createClientBooking,
  expireBookings,
  getBooking,
  guestLookupBooking,
  holdSeats,
  listBookings,
  mockPayBooking,
} from "../controllers/booking.controller.js";
import { optionalAuth, requireAuth, requireRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Public / Guest accessible routes
router.get("/lookup", guestLookupBooking);
router.post("/client-complete", optionalAuth, createClientBooking);
router.post("/hold-seats", optionalAuth, holdSeats);

// Member / Account routes
router.get("/my", requireAuth, listBookings);
router.post("/claim", requireAuth, claimBooking);

// Admin routes
router.get(
  "/admin/expire",
  requireAuth,
  requireRoles("admin", "superadmin"),
  expireBookings,
);
router.get(
  "/admin",
  requireAuth,
  requireRoles("staff", "manager", "admin", "superadmin"),
  listBookings,
);

// Individual booking routes
router.get("/:id", optionalAuth, getBooking);
router.post("/:id/cancel", optionalAuth, cancelBooking);
router.post("/:id/pay-mock", optionalAuth, mockPayBooking);

export default router;

