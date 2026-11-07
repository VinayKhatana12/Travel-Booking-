import { useState } from 'react';
import { CITIES } from '../utils/cities';
import { addDaysISO, todayISO } from '../utils/format';

/**
 * Quick-search box used in the landing hero. Posts to /hotels with the
 * selected city and dates.
 */
export default function SearchBox({ onSearch }) {
  const [city, setCity] = useState('GOA');
  const [checkIn, setCheckIn] = useState(addDaysISO(todayISO(), 7));
  const [checkOut, setCheckOut] = useState(addDaysISO(todayISO(), 9));

  const handleCheckIn = (value) => {
    setCheckIn(value);
    if (value && checkOut <= value) setCheckOut(addDaysISO(value, 1));
  };

  const submit = (event) => {
    event.preventDefault();
    onSearch({ city, checkIn, checkOut });
  };

  return (
    <form onSubmit={submit} className="card grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" aria-label="Quick trip search">
      <div>
        <label htmlFor="qs-city" className="label">Destination</label>
        <select id="qs-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
          {CITIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="qs-checkin" className="label">Check-in</label>
        <input
          id="qs-checkin"
          type="date"
          className="input"
          min={todayISO()}
          value={checkIn}
          onChange={(e) => handleCheckIn(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="qs-checkout" className="label">Check-out</label>
        <input
          id="qs-checkout"
          type="date"
          className="input"
          min={addDaysISO(checkIn, 1)}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary h-[42px]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        Search trips
      </button>
    </form>
  );
}
