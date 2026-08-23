const express = require("express");
const router = express.Router();
const db = require("../db");
const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

// GET /api/admin/bookings — all bookings, newest first, optional ?status=
router.get("/bookings", (req, res) => {
  let bookings = db.getBookings();
  const { status } = req.query;
  if (status) bookings = bookings.filter((b) => b.status === status);
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(bookings);
});

// GET /api/admin/summary — quick totals for the dashboard header
router.get("/summary", (req, res) => {
  const bookings = db.getBookings();
  const paid = bookings.filter((b) => b.status === "paid");
  const revenue = paid.reduce((sum, b) => sum + b.amountTotal, 0);
  res.json({
    totalBookings: bookings.length,
    paidBookings: paid.length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    revenue, // cents, assumes single currency (usd)
  });
});

module.exports = router;
