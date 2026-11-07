import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config.js';
import { generalLimiter } from './middleware/rateLimiters.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import flightRoutes from './routes/flightRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api', generalLimiter);

  // Liveness probe
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'wanderly-api', time: new Date().toISOString() });
  });

  // Feature routers
  app.use('/api/auth', authRoutes);
  app.use('/api/hotels', hotelRoutes);
  app.use('/api/flights', flightRoutes);
  app.use('/api/bookings', bookingRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
