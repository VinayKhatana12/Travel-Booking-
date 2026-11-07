import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CITIES } from '../utils/cities';
import { addDaysISO, todayISO } from '../utils/format';
import { flightService } from '../services/flightService';
import FlightCard from '../components/FlightCard';
import { FlightListSkeleton } from '../components/Skeleton';
import { EmptyState, ErrorState } from '../components/States';

const SORT_OPTIONS = [
  { value: 'price', label: 'Cheapest' },
  { value: 'departure', label: 'Earliest departure' },
  { value: 'duration', label: 'Shortest duration' },
];

export default function Flights() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const date = params.get('date') || '';
  const adults = params.get('adults') || '1';
  const sort = params.get('sort') || 'price';

  const [form, setForm] = useState({ from: from || 'DEL', to: to || 'DXB', date: date || addDaysISO(todayISO(), 7), adults });
  const [result, setResult] = useState(null); // null → not searched / loading
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const searched = Boolean(from && to && date);

  useEffect(() => {
    if (!searched) return;
    const controller = new AbortController();
    setResult(null);
    setError('');
    flightService
      .search({ from, to, date, adults }, controller.signal)
      .then(setResult)
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [from, to, date, adults, searched, retryCount]);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const swap = () => setForm((f) => ({ ...f, from: f.to, to: f.from }));

  const submitSearch = (event) => {
    event.preventDefault();
    setParams({
      from: form.from,
      to: form.to,
      date: form.date,
      adults: String(form.adults),
      ...(sort !== 'price' ? { sort } : {}),
    });
  };

  const updateParam = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: true }
    );
  };

  const sortedFlights = (() => {
    if (!result?.flights) return null;
    const list = [...result.flights];
    if (sort === 'departure') list.sort((a, b) => a.departTime.localeCompare(b.departTime));
    else if (sort === 'duration') list.sort((a, b) => a.durationMins - b.durationMins);
    else list.sort((a, b) => a.pricePerAdult - b.pricePerAdult);
    return list;
  })();

  const selectFlight = (flight) => {
    const query = new URLSearchParams({
      type: 'flight',
      from: flight.from,
      to: flight.to,
      date,
      adults,
      offerId: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departTime: flight.departTime,
      arriveTime: flight.arriveTime,
      durationMins: String(flight.durationMins),
      stops: String(flight.stops),
      cabinClass: flight.cabinClass,
      price: String(flight.pricePerAdult),
    });
    navigate(`/checkout?${query.toString()}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-stone-800">Find flights</h1>
      <p className="mt-1 text-sm text-stone-500">
        Live schedules from Amadeus when available, sample data otherwise — prices in INR.
      </p>

      {/* Search form */}
      <form onSubmit={submitSearch} className="card mt-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr_auto_auto] lg:items-end">
          <div>
            <label htmlFor="from" className="label">From</label>
            <select id="from" className="input" value={form.from} onChange={(e) => updateForm('from', e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={swap}
            aria-label="Swap origin and destination"
            className="mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-300 text-stone-500 transition hover:border-teal-600 hover:text-teal-700 lg:mb-1"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-90 lg:rotate-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M7 16h10m0 0-3-3m3 3-3 3M17 8H7m0 0 3 3M7 8l3-3" />
            </svg>
          </button>
          <div>
            <label htmlFor="to" className="label">To</label>
            <select id="to" className="input" value={form.to} onChange={(e) => updateForm('to', e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input
              id="date"
              type="date"
              className="input"
              min={todayISO()}
              value={form.date}
              onChange={(e) => updateForm('date', e.target.value)}
            />
          </div>
          <div className="w-full lg:w-24">
            <label htmlFor="adults" className="label">Adults</label>
            <select id="adults" className="input" value={form.adults} onChange={(e) => updateForm('adults', e.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary h-[42px] px-6">Search</button>
        </div>
      </form>

      {searched && (
        <section aria-label="Flight results" className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-stone-800">
              {result === null ? 'Searching flights…' : `${sortedFlights?.length ?? 0} flights · ${from} → ${to}`}
            </h2>
            <div className="w-44">
              <label htmlFor="flight-sort" className="sr-only">Sort flights</label>
              <select id="flight-sort" className="input" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {result?.notice && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">
              {result.notice}
            </p>
          )}
          {result?.source === 'sample' && !result.notice && (
            <p className="mt-3 text-xs text-stone-400">
              Showing sample schedules (add Amadeus API keys in server/.env for live data).
            </p>
          )}

          <div className="mt-4 space-y-4">
            {error ? (
              <ErrorState
                title="Could not search flights"
                message={error}
                onRetry={() => setRetryCount((r) => r + 1)}
              />
            ) : result === null ? (
              <FlightListSkeleton count={5} />
            ) : sortedFlights.length === 0 ? (
              <EmptyState
                icon="✈️"
                title="No flights found"
                subtitle="Try a different date, route or fewer passengers."
              />
            ) : (
              sortedFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  adults={Number(adults) || 1}
                  onSelect={() => selectFlight(flight)}
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
