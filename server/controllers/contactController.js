import { pool } from '../db/pool.js';

// POST /api/contact
export async function createContactMessage(req, res, next) {
  try {
    const { name, email, message } = req.validated.body;
    await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );
    res.status(201).json({
      ok: true,
      message: `Thanks ${name}! Our team will reply to ${email} within one business day.`,
    });
  } catch (err) {
    next(err);
  }
}
