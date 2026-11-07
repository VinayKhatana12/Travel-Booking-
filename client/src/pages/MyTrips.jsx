import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cityName } from '../utils/cities';
import { formatDate, formatDateShort, formatDuration, formatINR, formatTime } from '../utils/format';
import { bookingService } from '../services/bookingService';
import { ApiError } from '../services/api';
import { Banner, EmptyState, ErrorState, Spinner } from '../components/States';

function StatusBadge({ status }) {
  const confirmed = status === 'confirmed';
  return (
    <span
      className={`badge ${confirmed ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}
      aria-label={`Booking status: ${status}`}
    >
      <span aria-hidden="true">{confirmed ? '✓' : '⊘'}</span> {status}
    </span>
  );
}

function TripCard({ booking, onCancel, cancelling }) {
  const [confirming, setConfirming] = useState(false);
  const d = booking.details ?? {};
  const isHotel = booking.type === 'hotel';
  const confirmed = booking.status === 'confirmed';

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-xl" aria-hidden="true">
            {isHotel ? '🏨' : '✈️'}
          </span>
          <div>
            <p className="font-mono text-sm font-bold tracking-wider text-stone-800">{booking.ref}</p>
            <p className="text-xs text-stone-500">Booked {formatDate(booking.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} />
          <p className="text-lg font-extrabold text-stone-900">{formatINR(booking.total_amount)}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-1.5 border-t border-stone-100 pt-4 text-sm sm:grid-cols-2">
        {isHotel ? (
          <>
            <div className="flex gap-2"><dt className="text-stone-400">Hotel</dt><dd className="font-medium text-stone-700">{d.hotelName}, {cityName(d.cityCode)}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-400">Dates</dt><dd className="text-stone-700">{formatDateShort(d.checkIn)} → {formatDateShort(d.checkOut)} ({d.nights}N)</dd></div>
            <div className="flex gap-2"><dt className="text-stone-400">Guests</dt><dd className="text-stone-700">{d.guests} guest{d.guests !== 1 ? 's' : ''} · {d.rooms} room{d.rooms !== 1 ? 's' : ''}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-400">Traveller</dt><dd className="text-stone-700">{d.guestName}</dd></div>
          </>
        ) : (
          <>
            <div className="flex gap-2"><dt className="text-stone-400">Flight</dt><dd className="font-medium text-stone-700">{d.airline} {d.flightNumber}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-400">Route</dt><dd className="text-stone-700">{d.from} → {d.to}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-400">Departure</dt><dd className="text-stone-700">{formatDateShort(d.date)} · {formatTime(d.departTime)}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-400">Duration</dt><dd className="text-stone-700">{formatDuration(d.durationMins)} · {d.stops === 0 ? 'nonstop' : `${d.stops} stop${d.stops > 1 ? 's' : ''}`}</dd></div>
          </>
        )}
      </dl>

      {confirmed && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-stone-100 pt-4">
          {confirming ? (
            <>
              <span className="mr-auto text-sm text-stone-500">Cancel this booking?</span>
              <button type="button" className="btn-secondary !px-4 !py-2" onClick={() => setConfirming(false)} disabled={cancelling}>
                Keep it
              </button>
              <button type="button" className="btn-danger" onClick={() => { setConfirming(false); onCancel(booking.ref); }} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
            </>
          ) : (
            <button type="button" className="btn-secondary !px-4 !py-2 !text-red-600" onClick={() => setConfirming(true)}>
              Cancel booking
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default function MyTrips() {
  const [bookings, setBookings] = useState(null); // null → loading
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingRef, setCancellingRef] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setBookings(null);
    setError('');
    bookingService
      .list(controller.signal)
      .then((data) => setBookings(data.bookings))
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [retryCount]);

  const cancel = async (ref) => {
    setCancellingRef(ref);
    setActionError('');
    try {
      const data = await bookingService.cancel(ref);
      setBookings((list) => list.map((b) => (b.ref === ref ? data.booking : b)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not cancel the booking.');
    } finally {
      setCancellingRef('');
    }
  };

  if (error && bookings === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState title="Could not load your trips" message={error} onRetry={() => setRetryCount((r) => r + 1)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-stone-800">My Trips</h1>
      <p className="mt-1 text-sm text-stone-500">Every hotel and flight you've booked, in one dashboard.</p>

      {actionError && (
        <div className="mt-4">
          <Banner kind="error">{actionError}</Banner>
        </div>
      )}

      {bookings === null ? (
        <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading your trips">
          <Spinner className="h-10 w-10" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🧳"
            title="No trips yet"
            subtitle="Your bookings will appear here the moment you make one. Where to next?"
          >
            <Link to="/hotels" className="btn-primary">Find a stay</Link>
            <Link to="/flights" className="btn-secondary">Find a flight</Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((booking) => (
            <TripCard
              key={booking.id}
              booking={booking}
              onCancel={cancel}
              cancelling={cancellingRef === booking.ref}
            />
          ))}
        </div>
      )}
    </div>
  );
}
