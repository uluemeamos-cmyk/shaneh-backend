// sms.js — optional SMS confirmation to the customer via Twilio.
// If TWILIO_ACCOUNT_SID isn't set in .env, this silently no-ops so the
// project still runs fine without SMS configured.

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID) return null;
  const twilio = require("twilio");
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendBookingSMS(booking) {
  const client = getClient();
  if (!client || !booking.customerPhone) return;

  const amount = (booking.amountTotal / 100).toFixed(2);
  const label = booking.kind === "trip" ? "trip" : "car rental";

  await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to: booking.customerPhone,
    body: `Shaneh No Limit: your ${label} "${booking.itemTitle}" is confirmed. Total paid: $${amount}. Booking #${booking.id.slice(0, 8)}.`,
  });
}

module.exports = { sendBookingSMS };
