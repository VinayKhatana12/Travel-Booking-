/** Hotel star rating: filled stars + an accessibility label. */
export default function Stars({ count = 0, className = '' }) {
  const n = Math.max(0, Math.min(5, Number(count) || 0));
  return (
    <span className={`inline-flex items-center text-amber-400 ${className}`} aria-label={`${n}-star hotel`}>
      <span aria-hidden="true">
        {'★'.repeat(n)}
        <span className="text-stone-300">{'★'.repeat(5 - n)}</span>
      </span>
    </span>
  );
}

export function RatingBadge({ rating }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2 py-1 text-xs font-bold text-white"
      aria-label={`Guest rating ${rating} out of 5`}
    >
      {Number(rating).toFixed(1)}
    </span>
  );
}
