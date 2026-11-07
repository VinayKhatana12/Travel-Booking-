import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { listHotels, getHotel } from '../controllers/hotelController.js';

const router = Router();

/** Treats "", null and missing as "not provided", then coerces to int. */
const optionalInt = (max) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(max).optional()
  );

const citySchema = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().trim().toUpperCase().length(3, 'City code must be 3 letters').optional()
);

const listQuerySchema = z.object({
  city: citySchema,
  minPrice: optionalInt(10_000_000),
  maxPrice: optionalInt(10_000_000),
  stars: z.preprocess(
    (v) => (Array.isArray(v) ? v : typeof v === 'string' && v !== '' ? v.split(',') : []),
    z.array(z.coerce.number().int().min(1).max(5)).max(5)
  ),
  sort: z
    .enum(['recommended', 'price_asc', 'price_desc', 'rating_desc', 'stars_desc'])
    .default('recommended'),
});

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive('Hotel id must be a positive number'),
});

router.get('/', validate({ query: listQuerySchema }), listHotels);
router.get('/:id', validate({ params: idParamsSchema }), getHotel);

export default router;
