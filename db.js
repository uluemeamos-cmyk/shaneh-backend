// db.js — minimal JSON-file data store.
//
// This is intentionally simple so the project runs with zero external
// database setup. For production, swap `readJSON`/`writeJSON` calls for
// a real database (Postgres, MongoDB, etc.) — the routes only call
// getTrips / getCarRentals / addBooking / updateBooking / getBooking,
// so you only need to change this one file.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const TRIPS_FILE = path.join(DATA_DIR, "trips.json");
const CARS_FILE = path.join(DATA_DIR, "car-rentals.json");
const HOTELS_FILE = path.join(DATA_DIR, "hotels.json");
const PICKUPS_FILE = path.join(DATA_DIR, "airport-pickups.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getTrips() {
  return readJSON(TRIPS_FILE);
}

function getTripById(id) {
  return getTrips().find((t) => t.id === id);
}

function getCarRentals() {
  return readJSON(CARS_FILE);
}

function getCarRentalById(id) {
  return getCarRentals().find((c) => c.id === id);
}

function getHotels() {
  return readJSON(HOTELS_FILE);
}

function getHotelById(id) {
  return getHotels().find((h) => h.id === id);
}

function getAirportPickups() {
  return readJSON(PICKUPS_FILE);
}

function getAirportPickupById(id) {
  return getAirportPickups().find((p) => p.id === id);
}

function getBookings() {
  return readJSON(BOOKINGS_FILE);
}

function getBooking(id) {
  return getBookings().find((b) => b.id === id);
}

function addBooking(booking) {
  const bookings = getBookings();
  bookings.push(booking);
  writeJSON(BOOKINGS_FILE, bookings);
  return booking;
}

function updateBooking(id, updates) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...updates };
  writeJSON(BOOKINGS_FILE, bookings);
  return bookings[idx];
}

module.exports = {
  getTrips,
  getTripById,
  getCarRentals,
  getCarRentalById,
  getHotels,
  getHotelById,
  getAirportPickups,
  getAirportPickupById,
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
};
