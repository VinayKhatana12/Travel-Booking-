import { formatDateShort, formatDuration, formatINR, formatTime } from '../utils/format';

function AirlineAvatar({ airline }) {
  const initial = airline?.[0] ?? '?';
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white"
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

function TimeColumn({ label, time, code, nextDay }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-stone-800">
        {formatTime(time)}
        {nextDay && <span className="ml-1 align-middle text-xs font-semibold text-teal-700">+1d</span>}
      </p>
      <p className="text-sm text-stone-500">{code}</p>
    </div>
  );
}

export default function FlightCard({ flight, adults, onSelect }) {
  const nextDay = flight.departTime && flight.arriveTime
    ? new Date(flight.arriveTime).getDate() !== new Date(flight.departTime).getDate()
    : false;

  return (
    <article className="card p-5 transition hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AirlineAvatar airline={flight.airline} />
          <div>
            <p className="font-semibold text-stone-800">{flight.airline}</p>
            <p className="text-xs text-stone-500">
              {flight.flightNumber} · {flight.cabinClass === 'ECONOMY' ? 'Economy' : flight.cabinClass}
              {flight.seatsLeft ? ` · ${flight.seatsLeft} seats left` : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-stone-900">{formatINR(flight.pricePerAdult)}</p>
          <p className="text-xs text-stone-500">
            per adult{adults > 1 && <> · total {formatINR(flight.pricePerAdult * adults)}</>}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-stone-100 pt-4">
        <TimeColumn label="Depart" time={flight.departTime} code={flight.from} />
        <div className="text-center">
          <p className="text-sm font-medium text-stone-600">{formatDuration(flight.durationMins)}</p>
          <div className="relative my-1 flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            <span className="h-px flex-1 bg-stone-200" />
            <span className="mx-1 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
              {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}${flight.via ? ` via ${flight.via}` : ''}`}
            </span>
            <span className="h-px flex-1 bg-stone-200" />
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
          </div>
          <p className="text-xs text-stone-400">{formatDateShort(flight.departTime)}</p>
        </div>
        <TimeColumn label="Arrive" time={flight.arriveTime} code={flight.to} nextDay={nextDay} />
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" className="btn-primary" onClick={onSelect}>
          Select flight
        </button>
      </div>
    </article>
  );
}
