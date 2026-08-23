const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const db = require("../db");
const { sendBookingNotification } = require("../email");
const { sendBookingSMS } = require("../sms");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

// NOTE: this route is mounted with express.raw() in server.js (Stripe
// requires the exact raw request body to verify the signature — do not
// apply express.json() to this route).
router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata && session.metadata.bookingId;

    if (bookingId) {
      const updated = db.updateBooking(bookingId, {
        status: "paid",
        paidAt: new Date().toISOString(),
        stripePaymentIntent: session.payment_intent,
      });

      if (updated) {
        sendBookingNotification(updated).catch((err) =>
          console.error("Email notification failed:", err.message)
        );
        sendBookingSMS(updated).catch((err) =>
          console.error("SMS notification failed:", err.message)
        );
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;
