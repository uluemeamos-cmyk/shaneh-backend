require("dotenv").config();
const express = require("express");
const cors = require("cors");

const tripsRouter = require("./routes/trips");
const carRentalsRouter = require("./routes/carRentals");
const hotelsRouter = require("./routes/hotels");
const airportPickupsRouter = require("./routes/airportPickups");
const paymentsRouter = require("./routes/payments");
const webhookRouter = require("./routes/webhook");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4242;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

app.use(cors({ origin: FRONTEND_URL }));

// IMPORTANT: the Stripe webhook needs the raw body to verify its
// signature, so it's mounted BEFORE express.json() and given its own
// raw parser. Every other route below uses normal JSON parsing.
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/trips", tripsRouter);
app.use("/api/car-rentals", carRentalsRouter);
app.use("/api/hotels", hotelsRouter);
app.use("/api/airport-pickups", airportPickupsRouter);
app.use("/api/checkout", paymentsRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Shaneh backend listening on port ${PORT}`);
});

