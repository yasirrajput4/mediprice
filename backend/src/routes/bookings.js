const router = require("express").Router();
const {
  createBooking,
  getBooking,
  listUserBookings,
  cancelBooking,
  submitReview,
} = require("../controllers/bookingController");
const { authenticate, optionalAuth } = require("../middleware/auth");

router.post("/", optionalAuth, createBooking);
router.get("/", authenticate, listUserBookings);
router.get("/:id", optionalAuth, getBooking);
router.patch("/:id/cancel", authenticate, cancelBooking);
router.post("/:id/review", authenticate, submitReview);

module.exports = router;
