import jwt from 'jsonwebtoken';
import { env } from '../config.js';

export const COOKIE_NAME = 'wanderly_token';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd, // https-only in production
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Guards routes that require a logged-in user. Reads the httpOnly JWT cookie
 * and attaches the decoded payload to req.user.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!payload?.sub) throw new Error('Invalid token payload');
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}
