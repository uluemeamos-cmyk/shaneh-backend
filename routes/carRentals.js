const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/car-rentals — list all cars
router.get("/", (req, res) => {
  res.json(db.getCarRentals());
});

// GET /api/car-rentals/:id — single car
router.get("/:id", (req, res) => {
  const car = db.getCarRentalById(req.params.id);
  if (!car) return res.status(404).json({ error: "Car not found" });
  res.json(car);
});

module.exports = router;
