import { pool } from '../db/pool.js';

const SORTS = {
  recommended: 'rating DESC, price_per_night ASC',
  price_asc: 'price_per_night ASC, rating DESC',
  price_desc: 'price_per_night DESC, rating DESC',
  rating_desc: 'rating DESC, price_per_night ASC',
  stars_desc: 'stars DESC, rating DESC',
};

// GET /api/hotels?city=&minPrice=&maxPrice=&stars=&sort=
export async function listHotels(req, res, next) {
  try {
    const { city, minPrice, maxPrice, stars, sort } = req.validated.query;

    // Dynamic WHERE with parameterised values — user input never touches SQL text.
    const where = [];
    const params = [];
    if (city) {
      params.push(city);
      where.push(`city_code = $${params.length}`);
    }
    if (minPrice !== undefined) {
      params.push(minPrice);
      where.push(`price_per_night >= $${params.length}`);
    }
    if (maxPrice !== undefined) {
      params.push(maxPrice);
      where.push(`price_per_night <= $${params.length}`);
    }
    if (stars.length > 0) {
      params.push(stars);
      where.push(`stars = ANY($${params.length}::int[])`);
    }

    const orderBy = SORTS[sort] || SORTS.recommended;
    const sql = `
      SELECT id, city_code, name, stars, rating, price_per_night, amenities, image_url
      FROM hotels
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${orderBy}
      LIMIT 100
    `;
    const { rows } = await pool.query(sql, params);
    res.json({ hotels: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/hotels/:id
export async function getHotel(req, res, next) {
  try {
    const { id } = req.validated.params;
    const { rows } = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Hotel not found.' });
    }
    res.json({ hotel: rows[0] });
  } catch (err) {
    next(err);
  }
}
