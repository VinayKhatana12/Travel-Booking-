import rateLimit from 'express-rate-limit';

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({ error: message });
};

/** Light global cap on /api to absorb noisy traffic. */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many requests from this IP — please slow down.'),
});

/** Tighter cap on credential routes (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many authentication attempts — try again in 15 minutes.'),
});

/** Contact form spam guard. */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many messages sent — please try again a bit later.'),
});
