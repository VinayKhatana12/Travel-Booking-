import 'dotenv/config';

/**
 * Central configuration. The app boots with safe development defaults so
 * `npm start` never crashes; production (NODE_ENV=production) is strict and
 * refuses to start without every required variable set.
 */

function requireInProduction(value, key) {
  if ((value === undefined || value === '') && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}. See .env.example.`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,

  databaseUrl:
    requireInProduction(process.env.DATABASE_URL, 'DATABASE_URL') ||
    'postgresql://postgres:postgres@localhost:5432/wanderly',

  jwtSecret:
    requireInProduction(process.env.JWT_SECRET, 'JWT_SECRET') ||
    'dev-only-secret-do-not-use-in-production',

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  isProd: process.env.NODE_ENV === 'production',

  amadeus: {
    clientId: process.env.AMADEUS_CLIENT_ID || '',
    clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
    baseUrl: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com',
  },
};

if (!process.env.JWT_SECRET && !env.isProd) {
  console.warn('⚠️  JWT_SECRET not set — using a dev-only fallback. Create server/.env for real use.');
}
if (!env.amadeus.clientId && !env.isProd) {
  console.warn('ℹ️  AMADEUS_CLIENT_ID not set — /api/flights will serve generated sample data.');
}
