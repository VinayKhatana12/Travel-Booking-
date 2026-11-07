export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <svg className={`animate-spin text-teal-600 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function EmptyState({ icon = '🧭', title, subtitle, children }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="text-5xl" aria-hidden="true">{icon}</span>
      <h3 className="mt-4 text-lg font-semibold text-stone-800">{title}</h3>
      {subtitle && <p className="mt-1 max-w-md text-sm text-stone-500">{subtitle}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="card flex flex-col items-center border-red-200 bg-red-50 px-6 py-14 text-center" role="alert">
      <span className="text-5xl" aria-hidden="true">⚠️</span>
      <h3 className="mt-4 text-lg font-semibold text-red-800">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-red-600">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-6">
          Try again
        </button>
      )}
    </div>
  );
}

export function Banner({ kind = 'success', children }) {
  const styles =
    kind === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-700';
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`} role={kind === 'success' ? 'status' : 'alert'} aria-live="polite">
      {children}
    </div>
  );
}
