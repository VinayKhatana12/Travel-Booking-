import { useState } from 'react';

/** Password input with a show/hide toggle and inline error display. */
export default function PasswordField({
  label,
  id,
  value,
  onChange,
  error,
  autoComplete,
  hint,
  placeholder,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`input pr-16 ${error ? 'input-error' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-1 right-1.5 my-auto cursor-pointer rounded-lg px-3 text-xs font-semibold text-stone-500 transition hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-stone-400">{hint}</p>
      )}
    </div>
  );
}
