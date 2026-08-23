const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  res.json(db.getAirportPickups());
});

router.get("/:id", (req, res) => {
  const pickup = db.getAirportPickupById(req.params.id);
  if (!pickup) return res.status(404).json({ error: "Transfer not found" });
  res.json(pickup);
});

module.exports = router;
