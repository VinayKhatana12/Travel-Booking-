import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CITIES } from '../utils/cities';
import { hotelService } from '../services/hotelService';
import HotelCard from '../components/HotelCard';
import { HotelGridSkeleton } from '../components/Skeleton';
import { EmptyState, ErrorState } from '../components/States';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating_desc', label: 'Guest rating' },
  { value: 'stars_desc', label: 'Star rating' },
];

const CITY_CODES = CITIES.map((c) => c.code);

export default function Hotels() {
  const [params, setParams] = useSearchParams();
  const [hotels, setHotels] = useState(null); // null → loading
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Filters live in the URL — shareable and back-button friendly.
  const city = params.get('city') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const starsCsv = params.get('stars') || '';
  const sort = params.get('sort') || 'recommended';
  const selectedStars = useMemo(() => starsCsv.split(',').filter(Boolean), [starsCsv]);

  useEffect(() => {
    const controller = new AbortController();
    setHotels(null);
    setError('');
    hotelService
      .list(
        { city, minPrice, maxPrice, stars: starsCsv, sort },
        controller.signal
      )
      .then((data) => setHotels(data.hotels))
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [city, minPrice, maxPrice, starsCsv, sort, retryCount]);

  const updateParam = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === '' || value == null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true }
    );
  };

  const toggleStar = (n) => {
    const next = selectedStars.includes(n)
      ? selectedStars.filter((s) => s !== String(n))
      : [...selectedStars, String(n)];
    updateParam('stars', next.join(','));
  };

  const hasFilters = Boolean(city || minPrice || maxPrice || starsCsv);

  const clearFilters = () => setParams(sort ? { sort } : {}, { replace: true });

  const cityName = CITIES.find((c) => c.code === city)?.name;

  const filtersPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="filter-city" className="label">
          City
        </label>
        <select
          id="filter-city"
          className="input"
          value={city}
          onChange={(e) => updateParam('city', e.target.value)}
        >
          <option value="">Any city</option>
          {CITIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Price per night (₹)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="500"
            placeholder="Min"
            aria-label="Minimum price per night"
            className="input"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
          />
          <span className="text-stone-400">–</span>
          <input
            type="number"
            min="0"
            step="500"
            placeholder="Max"
            aria-label="Maximum price per night"
            className="input"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Star rating</legend>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={selectedStars.includes(String(n))}
                onChange={() => toggleStar(n)}
                className="h-4 w-4 rounded border-stone-300 accent-teal-600"
              />
              <span aria-hidden="true" className="text-amber-400">
                {'★'.repeat(n)}
                <span className="text-stone-300">{'★'.repeat(5 - n)}</span>
              </span>
              <span className="text-stone-500">{n}-star</span>
            </label>
          ))}
        </div>
      </fieldset>

      {hasFilters && (
        <button type="button" onClick={clearFilters} className="btn-secondary w-full">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-800">
            {cityName ? `Hotels in ${cityName}` : 'All hotels'}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {hotels === null ? 'Searching stays…' : `${hotels.length} stay${hotels.length === 1 ? '' : 's'} found`}
            {hasFilters ? ' · filters applied' : ''}
          </p>
        </div>
        <div className="w-48">
          <label htmlFor="sort" className="sr-only">
            Sort hotels
          </label>
          <select
            id="sort"
            className="input"
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile filters */}
      <details className="card mt-6 p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-teal-700">
          Filters {hasFilters && <span className="chip ml-2">on</span>}
        </summary>
        <div className="mt-4">{filtersPanel}</div>
      </details>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-5">{filtersPanel}</div>
        </aside>

        <section aria-label="Hotel results">
          {error ? (
            <ErrorState
              title="Could not load hotels"
              message={error}
              onRetry={() => setRetryCount((r) => r + 1)}
            />
          ) : hotels === null ? (
            <HotelGridSkeleton count={6} />
          ) : hotels.length === 0 ? (
            <EmptyState
              icon="🏝️"
              title="No hotels match your filters"
              subtitle="Try widening the price range, removing a star rating, or searching another city."
            >
              <button type="button" onClick={clearFilters} className="btn-primary">
                Clear all filters
              </button>
            </EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
