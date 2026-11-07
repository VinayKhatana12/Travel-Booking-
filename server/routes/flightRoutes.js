import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { searchFlightsHandler } from '../controllers/flightController.js';

const router = Router();

const dateNotPast = (value) => {
  const d = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + 330);
  return !Number.isNaN(d.getTime()) && d >= today && d <= max;
};

const searchQuerySchema = z.object({
  from: z.string().trim().toUpperCase().length(3, 'Origin must be a 3-letter city code'),
  to: z.string().trim().toUpperCase().length(3, 'Destination must be a 3-letter city code'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .refine(dateNotPast, 'Date must be within 11 months from today'),
  adults: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 1 : v),
    z.coerce.number().int().min(1).max(6).default(1)
  ),
});

router.get('/', validate({ query: searchQuerySchema }), searchFlightsHandler);

export default router;
