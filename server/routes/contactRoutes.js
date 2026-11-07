import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiters.js';
import { createContactMessage } from '../controllers/contactController.js';

const router = Router();

const contactBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(120),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message is too long (max 1000 characters)'),
});

router.post('/', contactLimiter, validate({ body: contactBodySchema }), createContactMessage);

export default router;
