export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#0d9488" />
        <path d="M16 36 L52 18 L40 50 L31 39 Z" fill="#ffffff" />
        <path d="M31 39 L52 18 L36 46 Z" fill="#99f6e4" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-stone-800">
        Wander<span className="text-teal-600">ly</span>
      </span>
    </span>
  );
}
