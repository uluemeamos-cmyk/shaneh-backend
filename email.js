// email.js — optional booking notification email.
// If SMTP_HOST is not set in .env, this silently no-ops so the project
// still runs fine without email configured.

const nodemailer = require("nodemailer");

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendBookingNotification(booking) {
  const transport = getTransport();
  if (!transport) return;

  const amount = (booking.amountTotal / 100).toFixed(2);

  await transport.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
    subject: `New paid booking: ${booking.itemTitle}`,
    text: [
      `A new booking was paid.`,
      ``,
      `Type: ${booking.kind}`,
      `Item: ${booking.itemTitle}`,
      `Customer: ${booking.customerName} <${booking.customerEmail}>`,
      `Amount: ${amount} ${booking.currency.toUpperCase()}`,
      `Booking ID: ${booking.id}`,
    ].join("\n"),
  });
}

module.exports = { sendBookingNotification };
