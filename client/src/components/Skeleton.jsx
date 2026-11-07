const shimmer = 'animate-pulse rounded-md bg-stone-200';

export function HotelCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="h-48 w-full bg-stone-200" />
      <div className="space-y-3 p-5">
        <div className={`${shimmer} h-5 w-3/4`} />
        <div className={`${shimmer} h-4 w-1/3`} />
        <div className="flex gap-2 pt-1">
          <div className={`${shimmer} h-6 w-20 rounded-full`} />
          <div className={`${shimmer} h-6 w-24 rounded-full`} />
          <div className={`${shimmer} h-6 w-16 rounded-full`} />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className={`${shimmer} h-7 w-28`} />
          <div className={`${shimmer} h-9 w-28 rounded-xl`} />
        </div>
      </div>
    </div>
  );
}

export function HotelGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <HotelCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-stone-200" />
          <div className="space-y-2">
            <div className={`${shimmer} h-4 w-40`} />
            <div className={`${shimmer} h-3 w-24`} />
          </div>
        </div>
        <div className={`${shimmer} h-8 w-32`} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className={`${shimmer} h-10 w-full`} />
        <div className={`${shimmer} h-10 w-full`} />
        <div className={`${shimmer} h-10 w-full`} />
      </div>
    </div>
  );
}

export function FlightListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <FlightCardSkeleton key={i} />
      ))}
    </div>
  );
}
