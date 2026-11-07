/**
 * Flight search service.
 *
 * - With AMADEUS_CLIENT_ID/SECRET set: calls the Amadeus Test API server-side
 *   so the secret never reaches the browser. Token is cached in memory.
 * - Without keys (or on any failure): falls back to a deterministic sample
 *   generator so the product always shows usable results.
 */
import { env } from '../config.js';

const AIRLINE_NAMES = {
  '6E': 'IndiGo',
  AI: 'Air India',
  UK: 'Vistara',
  SG: 'SpiceJet',
  IX: 'Air India Express',
  QP: 'Akasa Air',
  EK: 'Emirates',
  EY: 'Etihad Airways',
  QR: 'Qatar Airways',
  SQ: 'Singapore Airlines',
  TG: 'Thai Airways',
  FD: 'Thai AirAsia',
  AK: 'AirAsia',
  FZ: 'flydubai',
  WB: 'Wizz Air Malta',
};

const VIA_HUBS = ['BOM', 'DEL', 'BLR', 'CCU', 'CMB', 'AUH', 'DOH', 'SIN'];

// Wanderly city codes → real IATA airport codes (Amadeus requires the latter).
const FLIGHT_IATA = {
  GOA: 'GOI',
  DEL: 'DEL',
  BOM: 'BOM',
  BLR: 'BLR',
  JAI: 'JAI',
  DXB: 'DXB',
  SIN: 'SIN',
  BKK: 'BKK',
};

// ── Access token cache ──────────────────────────────────────────────────────
let cachedToken = null; // { token, expiresAt }

async function getAccessToken(signal) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.amadeus.clientId,
    client_secret: env.amadeus.clientSecret,
  });
  const res = await fetch(`${env.amadeus.baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal,
  });
  if (!res.ok) throw new Error(`Amadeus auth failed (${res.status})`);
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
  };
  return cachedToken.token;
}

// ── Amadeus response → normalised flights ───────────────────────────────────
function parseIsoDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso || '');
  if (!m) return 0;
  return Number(m[1] || 0) * 60 + Number(m[2] || 0);
}

function normalizeOffers(data, adults) {
  const offers = Array.isArray(data?.data) ? data.data : [];
  return offers
    .map((offer) => {
      try {
        const itin = offer.itineraries?.[0];
        const segments = itin?.segments ?? [];
        if (segments.length === 0) return null;
        const first = segments[0];
        const last = segments[segments.length - 1];
        const carrier = first.carrierCode;
        const grandTotal = Number(offer.price?.grandTotal ?? offer.price?.total ?? 0);
        if (!grandTotal) return null;
        return {
          id: `amd-${offer.id}`,
          source: 'amadeus',
          airline: AIRLINE_NAMES[carrier] || carrier,
          airlineCode: carrier,
          flightNumber: segments
            .map((s) => `${s.carrierCode} ${s.number}`)
            .join(' · '),
          from: first.departure?.iataCode ?? '',
          to: last.arrival?.iataCode ?? '',
          departTime: first.departure?.at ?? '',
          arriveTime: last.arrival?.at ?? '',
          durationMins: parseIsoDuration(itin.duration),
          stops: Math.max(0, segments.length - 1),
          cabinClass: offer.travelerPricings?.[0]?.fareDetail?.cabin || 'ECONOMY',
          seatsLeft: offer.numberOfBookableSeats ?? null,
          pricePerAdult: Math.round(grandTotal / adults),
          total: Math.round(grandTotal),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.total - b.total);
}

// ── Deterministic sample data ────────────────────────────────────────────────
function seededRng(seed) {
  // xmur3 hash → mulberry32 PRNG: same input always yields the same schedule.
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSampleFlights({ from, to, date, adults }) {
  const rng = seededRng(`${from}-${to}-${date}`);
  const carriers = ['6E', 'AI', 'UK', 'QP', 'EK', 'EY', 'QR', 'SQ', 'TG', 'FZ'];
  const pad = (n) => String(n).padStart(2, '0');

  const flights = [];
  for (let i = 0; i < 8; i++) {
    const code = carriers[Math.floor(rng() * carriers.length)];
    const hour = 5 + Math.floor(rng() * 18);
    const minute = [0, 15, 30, 45][Math.floor(rng() * 4)];
    const stops = rng() < 0.35 ? 1 : 0;
    const baseDuration = 90 + Math.floor(rng() * 620);
    const durationMins = baseDuration + (stops ? 70 + Math.floor(rng() * 130) : 0);
    const pricePerAdult = Math.round((2500 + rng() * rng() * 17500) / 50) * 50;

    const dep = new Date(`${date}T${pad(hour)}:${pad(minute)}:00`);
    const arr = new Date(dep.getTime() + durationMins * 60000);

    flights.push({
      id: `smp-${from}${to}-${i}`,
      source: 'sample',
      airline: AIRLINE_NAMES[code] || code,
      airlineCode: code,
      flightNumber: `${code}-${100 + Math.floor(rng() * 900)}${stops ? ` / ${code}-${200 + Math.floor(rng() * 700)}` : ''}`,
      from,
      to,
      departTime: dep.toISOString(),
      arriveTime: arr.toISOString(),
      durationMins,
      stops,
      via: stops ? VIA_HUBS[Math.floor(rng() * VIA_HUBS.length)] : null,
      cabinClass: 'ECONOMY',
      seatsLeft: 2 + Math.floor(rng() * 8),
      pricePerAdult,
      total: pricePerAdult * adults,
    });
  }
  return flights.sort((a, b) => a.total - b.total);
}

// ── Public API ───────────────────────────────────────────────────────────────
const hasAmadeusKeys = () => Boolean(env.amadeus.clientId && env.amadeus.clientSecret);

export async function searchFlights({ from, to, date, adults }) {
  if (hasAmadeusKeys()) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);

      const token = await getAccessToken(controller.signal);
      const params = new URLSearchParams({
        originLocationCode: FLIGHT_IATA[from] || from,
        destinationLocationCode: FLIGHT_IATA[to] || to,
        departureDate: date,
        adults: String(adults),
        currencyCode: 'INR',
        max: '12',
      });
      const res = await fetch(
        `${env.amadeus.baseUrl}/v2/shopping/flight-offers?${params}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      clearTimeout(timer);

      if (!res.ok) throw new Error(`Amadeus search failed (${res.status})`);
      const data = await res.json();
      const flights = normalizeOffers(data, adults);
      if (flights.length > 0) {
        return { source: 'amadeus', flights, notice: null };
      }
      return {
        source: 'sample',
        flights: generateSampleFlights({ from, to, date, adults }),
        notice: 'The airline feed returned no offers for this route — showing sample schedules.',
      };
    } catch (err) {
      console.warn(`Flight search fell back to sample data: ${err.message}`);
      return {
        source: 'sample',
        flights: generateSampleFlights({ from, to, date, adults }),
        notice: 'Live flight data is unavailable right now — showing sample schedules.',
      };
    }
  }

  return {
    source: 'sample',
    flights: generateSampleFlights({ from, to, date, adults }),
    notice: null, // no keys configured — samples are the expected mode, don't nag
  };
}
