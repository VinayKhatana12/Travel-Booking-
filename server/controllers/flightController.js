import { searchFlights } from '../services/amadeus.js';

// GET /api/flights?from=&to=&date=&adults=
export async function searchFlightsHandler(req, res, next) {
  try {
    const { from, to, date, adults } = req.validated.query;
    const result = await searchFlights({ from, to, date, adults });
    res.json({
      from,
      to,
      date,
      adults,
      source: result.source,
      notice: result.notice,
      flights: result.flights,
    });
  } catch (err) {
    next(err);
  }
}
