import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { env } from '../config.js';
import { COOKIE_OPTIONS, COOKIE_NAME } from '../middleware/auth.js';

const SALT_ROUNDS = 10;
// Valid-format bcrypt hash of an unknown password — used to keep login timing
// consistent when the email doesn't exist (mitigates user enumeration).
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const toSafeUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  created_at: row.created_at,
});

function setAuthCookie(res, user) {
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

// POST /api/auth/signup
export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.validated.body;

    const existing = await pool.query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        fields: { email: 'This email is already registered — try logging in instead.' },
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    const user = toSafeUser(rows[0]);
    setAuthCookie(res, user);
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        fields: { email: 'This email is already registered — try logging in instead.' },
      });
    }
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM users WHERE lower(email) = $1`,
      [email]
    );
    const user = rows[0];

    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = toSafeUser(user);
    setAuthCookie(res, safeUser);
    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.json({ ok: true });
}

// GET /api/auth/me
export async function me(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(401).json({ error: 'This account no longer exists.' });
    }
    res.json({ user: toSafeUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}
