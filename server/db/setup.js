#!/usr/bin/env node
/**
 * Migration / seed script:  npm run db:setup   (add --reset to wipe user data)
 *
 * 1. Connects to the maintenance DB ("postgres") and creates the target
 *    database if it does not exist yet.
 * 2. Applies server/db/schema.sql (idempotent).
 * 3. Applies server/db/seed.sql (replaces hotel rows, keeps users/bookings).
 * 4. Prints a summary of row counts.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESET = process.argv.includes('--reset');

function dbConfig(urlString) {
  const url = new URL(urlString);
  const dbName = url.pathname.replace(/^\//, '');
  if (!/^[A-Za-z0-9_-]+$/.test(dbName)) {
    throw new Error(`DATABASE_URL must point at a simple database name, got "${dbName}"`);
  }
  return { url, dbName };
}

const target = dbConfig(env.databaseUrl);

function adminConnectionString() {
  const admin = new URL(env.databaseUrl);
  admin.pathname = '/postgres';
  return admin.toString();
}

async function ensureDatabase() {
  const client = new pg.Client({ connectionString: adminConnectionString() });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [target.dbName]);
    if (exists.rowCount === 0) {
      console.log(`📦 Creating database "${target.dbName}"...`);
      await client.query(`CREATE DATABASE "${target.dbName}"`);
    } else {
      console.log(`📦 Database "${target.dbName}" already exists.`);
    }
  } finally {
    await client.end();
  }
}

async function applySqlFile(client, file) {
  const sql = readFileSync(path.join(__dirname, file), 'utf8');
  await client.query(sql); // simple query protocol supports multi-statement scripts
}

async function main() {
  await ensureDatabase();

  const client = new pg.Client({ connectionString: env.databaseUrl });
  await client.connect();

  try {
    const { rows } = await client.query('SELECT version()');
    console.log(`🔌 ${rows[0].version.split(' ').slice(0, 2).join(' ')}`);

    if (RESET) {
      console.log('♻️  --reset: truncating bookings, contact_messages and users');
      await client.query('TRUNCATE bookings, contact_messages, users CASCADE');
    }

    console.log('🛠  Applying schema (server/db/schema.sql)...');
    await applySqlFile(client, 'schema.sql');

    console.log('🌱 Seeding hotels (server/db/seed.sql)...');
    await applySqlFile(client, 'seed.sql');

    const counts = await client.query(`
      SELECT
        (SELECT count(*) FROM users)             AS users,
        (SELECT count(*) FROM hotels)            AS hotels,
        (SELECT count(*) FROM bookings)          AS bookings,
        (SELECT count(*) FROM contact_messages)  AS contact_messages
    `);
    console.log('📊 Row counts:', counts.rows[0]);

    const cities = await client.query(
      'SELECT city_code, count(*) AS hotels FROM hotels GROUP BY city_code ORDER BY city_code'
    );
    console.log('🏙  Hotels per city:', cities.rows.map((r) => `${r.city_code}:${r.hotels}`).join('  '));

    console.log('✅ Database is ready.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ db:setup failed:', err.message);
  process.exit(1);
});
