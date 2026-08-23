const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Stripe = require("stripe");
const db = require("../db");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// POST /api/checkout/trip
// body: { tripId, adults, children, customerName, customerEmail, startDate }
router.post("/trip", async (req, res) => {
  try {
    const { tripId, adults = 1, children = 0, customerName, customerEmail, customerPhone, startDate } = req.body;

    if (!tripId || !customerName || !customerEmail) {
      return res.status(400).json({ error: "tripId, customerName and customerEmail are required" });
    }

    const trip = db.getTripById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const adultsCount = Math.max(1, parseInt(adults, 10) || 1);
    const childrenCount = Math.max(0, parseInt(children, 10) || 0);

    // Price is always calculated server-side from trusted data — never
    // trust a price sent by the client.
    const lineItems = [
      {
        price_data: {
          currency: trip.currency,
          product_data: {
            name: `${trip.title} — Adult`,
            description: `${trip.durationDays}-day trip package`,
          },
          unit_amount: trip.pricePerAdult,
        },
        quantity: adultsCount,
      },
    ];

    if (childrenCount > 0) {
      lineItems.push({
        price_data: {
          currency: trip.currency,
          product_data: {
            name: `${trip.title} — Child`,
            description: `${trip.durationDays}-day trip package`,
          },
          unit_amount: trip.pricePerChild,
        },
        quantity: childrenCount,
      });
    }

    const bookingId = uuidv4();
    const amountTotal =
      trip.pricePerAdult * adultsCount + trip.pricePerChild * childrenCount;

    db.addBooking({
      id: bookingId,
      kind: "trip",
      itemId: trip.id,
      itemTitle: trip.title,
      adults: adultsCount,
      children: childrenCount,
      startDate: startDate || null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      amountTotal,
      currency: trip.currency,
      status: "pending",
      stripeSessionId: null,
      createdAt: new Date().toISOString(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${FRONTEND_URL}/booking-success.html?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/booking-cancelled.html?booking_id=${bookingId}`,
      metadata: { bookingId, kind: "trip", tripId: trip.id },
    });

    db.updateBooking(bookingId, { stripeSessionId: session.id });

    res.json({ url: session.url, bookingId });
  } catch (err) {
    console.error("Trip checkout error:", err);
    res.status(500).json({ error: "Unable to start checkout" });
  }
});

// POST /api/checkout/car-rental
// body: { carId, days, customerName, customerEmail, pickupDate }
router.post("/car-rental", async (req, res) => {
  try {
    const { carId, days = 1, customerName, customerEmail, customerPhone, pickupDate } = req.body;

    if (!carId || !customerName || !customerEmail) {
      return res.status(400).json({ error: "carId, customerName and customerEmail are required" });
    }

    const car = db.getCarRentalById(carId);
    if (!car) return res.status(404).json({ error: "Car not found" });

    const dayCount = Math.max(1, parseInt(days, 10) || 1);
    const amountTotal = car.pricePerDay * dayCount;
    const bookingId = uuidv4();

    db.addBooking({
      id: bookingId,
      kind: "car-rental",
      itemId: car.id,
      itemTitle: car.name,
      days: dayCount,
      pickupDate: pickupDate || null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      amountTotal,
      currency: car.currency,
      status: "pending",
      stripeSessionId: null,
      createdAt: new Date().toISOString(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: car.currency,
            product_data: {
              name: car.name,
              description: `${dayCount} day rental`,
            },
            unit_amount: car.pricePerDay,
          },
          quantity: dayCount,
        },
      ],
      success_url: `${FRONTEND_URL}/booking-success.html?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/booking-cancelled.html?booking_id=${bookingId}`,
      metadata: { bookingId, kind: "car-rental", carId: car.id },
    });

    db.updateBooking(bookingId, { stripeSessionId: session.id });

    res.json({ url: session.url, bookingId });
  } catch (err) {
    console.error("Car rental checkout error:", err);
    res.status(500).json({ error: "Unable to start checkout" });
  }
});

// POST /api/checkout/hotel
// body: { hotelId, nights, customerName, customerEmail, customerPhone, checkInDate }
router.post("/hotel", async (req, res) => {
  try {
    const { hotelId, nights = 1, customerName, customerEmail, customerPhone, checkInDate } = req.body;

    if (!hotelId || !customerName || !customerEmail) {
      return res.status(400).json({ error: "hotelId, customerName and customerEmail are required" });
    }

    const hotel = db.getHotelById(hotelId);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const nightCount = Math.max(1, parseInt(nights, 10) || 1);
    const amountTotal = hotel.pricePerNight * nightCount;
    const bookingId = uuidv4();

    db.addBooking({
      id: bookingId,
      kind: "hotel",
      itemId: hotel.id,
      itemTitle: `${hotel.name} — ${hotel.location}`,
      nights: nightCount,
      checkInDate: checkInDate || null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      amountTotal,
      currency: hotel.currency,
      status: "pending",
      stripeSessionId: null,
      createdAt: new Date().toISOString(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: hotel.currency,
            product_data: {
              name: hotel.name,
              description: `${nightCount} night(s) — ${hotel.location}`,
            },
            unit_amount: hotel.pricePerNight,
          },
          quantity: nightCount,
        },
      ],
      success_url: `${FRONTEND_URL}/booking-success.html?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/booking-cancelled.html?booking_id=${bookingId}`,
      metadata: { bookingId, kind: "hotel", hotelId: hotel.id },
    });

    db.updateBooking(bookingId, { stripeSessionId: session.id });

    res.json({ url: session.url, bookingId });
  } catch (err) {
    console.error("Hotel checkout error:", err);
    res.status(500).json({ error: "Unable to start checkout" });
  }
});

// POST /api/checkout/airport-pickup
// body: { pickupId, customerName, customerEmail, customerPhone, arrivalDate, flightNumber }
router.post("/airport-pickup", async (req, res) => {
  try {
    const { pickupId, customerName, customerEmail, customerPhone, arrivalDate, flightNumber } = req.body;

    if (!pickupId || !customerName || !customerEmail) {
      return res.status(400).json({ error: "pickupId, customerName and customerEmail are required" });
    }

    const pickup = db.getAirportPickupById(pickupId);
    if (!pickup) return res.status(404).json({ error: "Transfer not found" });

    const amountTotal = pickup.price;
    const bookingId = uuidv4();

    db.addBooking({
      id: bookingId,
      kind: "airport-pickup",
      itemId: pickup.id,
      itemTitle: pickup.name,
      arrivalDate: arrivalDate || null,
      flightNumber: flightNumber || null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      amountTotal,
      currency: pickup.currency,
      status: "pending",
      stripeSessionId: null,
      createdAt: new Date().toISOString(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: pickup.currency,
            product_data: {
              name: pickup.name,
              description: "Airport transfer",
            },
            unit_amount: pickup.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/booking-success.html?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/booking-cancelled.html?booking_id=${bookingId}`,
      metadata: { bookingId, kind: "airport-pickup", pickupId: pickup.id },
    });

    db.updateBooking(bookingId, { stripeSessionId: session.id });

    res.json({ url: session.url, bookingId });
  } catch (err) {
    console.error("Airport pickup checkout error:", err);
    res.status(500).json({ error: "Unable to start checkout" });
  }
});

// GET /api/checkout/booking/:id — poll booking status from the success page
router.get("/booking/:id", (req, res) => {
  const booking = db.getBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(booking);
});

module.exports = router;

