const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/trips  — list all trip packages, optional ?type= filter
router.get("/", (req, res) => {
  let trips = db.getTrips();
  const { type } = req.query;
  if (type) {
    trips = trips.filter((t) => t.type.toLowerCase() === String(type).toLowerCase());
  }
  res.json(trips);
});

// GET /api/trips/:id — single trip package
router.get("/:id", (req, res) => {
  const trip = db.getTripById(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  res.json(trip);
});

module.exports = router;
