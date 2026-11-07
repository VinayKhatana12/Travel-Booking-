import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { createBooking, listBookings, cancelBooking } from '../controllers/bookingController.js';

const router = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const bookingBodySchema = z.object({
  type: z.enum(['hotel', 'flight']),
  details: z.object({
    // common traveller fields
    guestName: z.string().trim().min(2).max(80),
    guestEmail: z.string().trim().toLowerCase().email().max(120),
    guestPhone: z.string().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
    // hotel fields
    hotelId: z.coerce.number().int().positive().optional(),
    checkIn: z.string().regex(DATE_RE).optional(),
    checkOut: z.string().regex(DATE_RE).optional(),
    guests: z.coerce.number().int().min(1).max(6).optional(),
    rooms: z.coerce.number().int().min(1).max(4).optional(),
    // flight fields
    offerId: z.string().max(64).optional(),
    airline: z.string().max(60).optional(),
    flightNumber: z.string().max(40).optional(),
    from: z.string().trim().toUpperCase().length(3).optional(),
    to: z.string().trim().toUpperCase().length(3).optional(),
    date: z.string().regex(DATE_RE).optional(),
    departTime: z.string().max(40).optional(),
    arriveTime: z.string().max(40).optional(),
    durationMins: z.coerce.number().int().min(0).max(3000).optional(),
    stops: z.coerce.number().int().min(0).max(3).optional(),
    cabinClass: z.string().max(20).optional(),
    adults: z.coerce.number().int().min(1).max(6).optional(),
    price: z.coerce.number().min(500).max(5_000_000).optional(),
  }),
});

const refParamsSchema = z.object({
  ref: z.string().trim().toUpperCase().regex(/^WND-[A-F0-9]{8}$/, 'Booking reference format is WND-XXXXXXXX'),
});

router.use(requireAuth);

router.post('/', validate({ body: bookingBodySchema }), createBooking);
router.get('/', listBookings);
router.patch('/:ref/cancel', validate({ params: refParamsSchema }), cancelBooking);

export default router;
