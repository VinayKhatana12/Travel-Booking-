import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MS_PER_DAY = 86_400_000;

function nightsBetween(checkIn, checkOut) {
  const ms = new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`);
  return Math.round(ms / MS_PER_DAY);
}

function newRef() {
  return `WND-${randomBytes(4).toString('hex').toUpperCase()}`;
}

// POST /api/bookings  (auth required)
export async function createBooking(req, res, next) {
  const client = await pool.connect();
  try {
    const { type, details } = req.validated.body;
    const { guestName, guestEmail, guestPhone } = details;

    let totalAmount;
    let snapshot;

    if (type === 'hotel') {
      const { hotelId, checkIn, checkOut, guests, rooms } = details;
      const nights = nightsBetween(checkIn, checkOut);
      if (nights < 1 || nights > 30) {
        return res.status(400).json({
          error: 'Stay length must be between 1 and 30 nights.',
          fields: { checkOut: 'Check-out must be 1–30 nights after check-in' },
        });
      }

      // Authoritative price comes from the database, never from the client.
      const { rows } = await client.query(
        'SELECT id, name, city_code, price_per_night FROM hotels WHERE id = $1',
        [hotelId]
      );
      const hotel = rows[0];
      if (!hotel) {
        return res.status(400).json({ error: 'The selected hotel no longer exists.' });
      }

      totalAmount = hotel.price_per_night * nights * rooms;
      snapshot = {
        hotelId: hotel.id,
        hotelName: hotel.name,
        cityCode: hotel.city_code,
        checkIn,
        checkOut,
        nights,
        guests,
        rooms,
        pricePerNight: hotel.price_per_night,
        guestName,
        guestEmail,
        guestPhone,
      };
    } else {
      const { offerId, airline, flightNumber, from, to, date, departTime, arriveTime, durationMins, stops, cabinClass, adults, price } =
        details;

      totalAmount = Math.round(price * adults);
      snapshot = {
        offerId,
        airline,
        flightNumber,
        from,
        to,
        date,
        departTime,
        arriveTime,
        durationMins,
        stops,
        cabinClass,
        adults,
        pricePerAdult: price,
        guestName,
        guestEmail,
        guestPhone,
      };
    }

    // Insert (retry on the (very unlikely) ref collision).
    let booking;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { rows } = await client.query(
          `INSERT INTO bookings (ref, user_id, type, status, total_amount, details)
           VALUES ($1, $2, $3, 'confirmed', $4, $5)
           RETURNING id, ref, user_id, type, status, total_amount, details, created_at`,
          [newRef(), req.user.id, type, totalAmount, snapshot]
        );
        booking = rows[0];
        break;
      } catch (err) {
        if (err.code === '23505' && attempt < 2) continue;
        throw err;
      }
    }

    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/bookings  (current user)
export async function listBookings(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, ref, type, status, total_amount, details, created_at
       FROM bookings WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ bookings: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:ref/cancel  (current user)
export async function cancelBooking(req, res, next) {
  try {
    const { ref } = req.validated.params;
    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE ref = $1 AND user_id = $2
       RETURNING id, ref, type, status, total_amount, details, created_at`,
      [ref, req.user.id]
    );
    if (!rows[0]) {
      // Distinguish "not yours" from "doesn't exist" only by message, not status.
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json({ booking: rows[0] });
  } catch (err) {
    next(err);
  }
}
