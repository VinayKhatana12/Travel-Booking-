import { Link } from 'react-router-dom';
import { formatINR } from '../utils/format';
import { cityName } from '../utils/cities';
import HotelImage from './HotelImage';
import Stars, { RatingBadge } from './Stars';

export default function HotelCard({ hotel }) {
  const amenities = hotel.amenities?.slice(0, 3) ?? [];
  const extra = (hotel.amenities?.length ?? 0) - amenities.length;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/hotels/${hotel.id}`} className="block overflow-hidden" aria-label={`View details for ${hotel.name}`}>
        <HotelImage
          src={hotel.image_url}
          alt={`${hotel.name} in ${cityName(hotel.city_code)}`}
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug text-stone-800">
            <Link to={`/hotels/${hotel.id}`} className="hover:text-teal-700">
              {hotel.name}
            </Link>
          </h3>
          <RatingBadge rating={hotel.rating} />
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {cityName(hotel.city_code)} · <Stars count={hotel.stars} className="align-middle text-sm" />
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Amenities">
          {amenities.map((a) => (
            <li key={a} className="chip">{a}</li>
          ))}
          {extra > 0 && <li className="chip">+{extra} more</li>}
        </ul>
        <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-4">
          <p className="text-lg font-bold text-stone-900">
            {formatINR(hotel.price_per_night)}
            <span className="text-xs font-medium text-stone-500"> / night</span>
          </p>
          <Link to={`/hotels/${hotel.id}`} className="btn-secondary !px-4 !py-2">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
