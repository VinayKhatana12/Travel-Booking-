import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cityName } from '../utils/cities';
import { addDaysISO, formatINR, todayISO } from '../utils/format';
import { hotelService } from '../services/hotelService';
import HotelImage from '../components/HotelImage';
import Stars, { RatingBadge } from '../components/Stars';
import { EmptyState, ErrorState, Spinner } from '../components/States';

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [retryCount, setRetryCount] = useState(0);

  const [checkIn, setCheckIn] = useState(addDaysISO(todayISO(), 7));
  const [checkOut, setCheckOut] = useState(addDaysISO(todayISO(), 9));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    hotelService
      .get(id, controller.signal)
      .then((data) => {
        setHotel(data.hotel);
        setStatus('ready');
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err.message);
        setStatus(err.status === 404 ? 'not-found' : 'error');
      });
    return () => controller.abort();
  }, [id, retryCount]);

  const nights = useMemo(() => {
    const ms = new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`);
    return Math.max(0, Math.round(ms / 86400000));
  }, [checkIn, checkOut]);

  const total = hotel ? hotel.price_per_night * nights * rooms : 0;

  const handleCheckIn = (value) => {
    setCheckIn(value);
    if (value && checkOut <= value) setCheckOut(addDaysISO(value, 1));
  };

  const reserve = () => {
    const query = new URLSearchParams({
      type: 'hotel',
      hotelId: String(hotel.id),
      checkIn,
      checkOut,
      guests: String(guests),
      rooms: String(rooms),
    });
    navigate(`/checkout?${query.toString()}`);
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading hotel">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon="🔍"
          title="Hotel not found"
          subtitle="This stay may have been removed. Browse the full collection instead."
        >
          <Link to="/hotels" className="btn-primary">All hotels</Link>
        </EmptyState>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="Could not load this hotel"
          message={error}
          onRetry={() => setRetryCount((r) => r + 1)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/hotels" className="text-sm font-semibold text-teal-700 hover:underline">
        ← Back to hotels
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: presentation */}
        <div>
          <HotelImage
            src={hotel.image_url}
            alt={`${hotel.name} in ${cityName(hotel.city_code)}`}
            className="h-72 w-full rounded-2xl object-cover sm:h-96"
          />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-stone-800 sm:text-3xl">
                {hotel.name}
              </h1>
              <p className="mt-1.5 text-sm text-stone-500">
                {cityName(hotel.city_code)} · <Stars count={hotel.stars} className="align-middle" />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RatingBadge rating={hotel.rating} />
              <span className="text-sm text-stone-500">guest rating</span>
            </div>
          </div>

          <p className="mt-5 max-w-2xl leading-relaxed text-stone-600">{hotel.description}</p>

          <h2 className="mt-8 text-lg font-bold text-stone-800">Amenities</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {hotel.amenities.map((a) => (
              <li key={a} className="chip !bg-teal-50 !text-teal-700">
                {a}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: booking card */}
        <aside>
          <div className="card sticky top-24 p-6">
            <p className="text-2xl font-extrabold text-stone-900">
              {formatINR(hotel.price_per_night)}
              <span className="text-sm font-medium text-stone-500"> / night</span>
            </p>
            <p className="mt-1 text-xs text-stone-400">Taxes included — no hidden fees.</p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="checkin" className="label">
                    Check-in
                  </label>
                  <input
                    id="checkin"
                    type="date"
                    className="input"
                    min={todayISO()}
                    value={checkIn}
                    onChange={(e) => handleCheckIn(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="checkout" className="label">
                    Check-out
                  </label>
                  <input
                    id="checkout"
                    type="date"
                    className="input"
                    min={addDaysISO(checkIn, 1)}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guests" className="label">
                    Guests
                  </label>
                  <select
                    id="guests"
                    className="input"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} guest{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rooms" className="label">
                    Rooms
                  </label>
                  <select
                    id="rooms"
                    className="input"
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} room{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <dl className="space-y-2 border-t border-stone-100 pt-4 text-sm">
                <div className="flex justify-between text-stone-600">
                  <dt>
                    {formatINR(hotel.price_per_night)} × {nights} night{nights !== 1 ? 's' : ''} ×{' '}
                    {rooms} room{rooms !== 1 ? 's' : ''}
                  </dt>
                  <dd className="font-medium text-stone-800">{formatINR(hotel.price_per_night * nights * rooms)}</dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Taxes & fees</dt>
                  <dd className="text-teal-700 font-medium">Included</dd>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-stone-900">
                  <dt>Total</dt>
                  <dd>{formatINR(total)}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="btn-primary w-full"
                onClick={reserve}
                disabled={nights < 1}
                title={nights < 1 ? 'Check-out must be after check-in' : undefined}
              >
                Reserve — {formatINR(total)}
              </button>
              <p className="text-center text-xs text-stone-400">
                Demo checkout — payment is simulated, nothing is charged.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
