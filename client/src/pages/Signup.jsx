import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import PasswordField from '../components/PasswordField';
import { Banner } from '../components/States';
import Logo from '../components/Logo';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { user, initialising, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!initialising && user) {
    return <Navigate to={from || '/'} replace />;
  }

  const setValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
    if (serverError) setServerError('');
  };

  const validateField = (name, value) => {
    if (name === 'name') {
      if (!value.trim()) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
    }
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!emailRe.test(value.trim())) return 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/[A-Za-z]/.test(value)) return 'Password must include at least one letter';
      if (!/[0-9]/.test(value)) return 'Password must include at least one number';
    }
    return '';
  };

  const handleBlur = (name) => () => {
    setErrors((e) => ({ ...e, [name]: validateField(name, values[name]) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      name: validateField('name', values.name),
      email: validateField('email', values.email),
      password: validateField('password', values.password),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setServerError('');
    try {
      await signup({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      navigate(from || '/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) setErrors(err.fields);
        setServerError(err.message);
      } else {
        setServerError('Unexpected error — please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
      <div className="card p-8">
        <div className="flex flex-col items-center text-center">
          <Link to="/" aria-label="Wanderly home">
            <Logo />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-stone-800">Create your account</h1>
          <p className="mt-1 text-sm text-stone-500">
            One account for hotels, flights and every trip you book.
          </p>
        </div>

        {serverError && (
          <div className="mt-6">
            <Banner kind="error">{serverError}</Banner>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Aditi Sharma"
              value={values.name}
              onChange={(e) => setValue('name', e.target.value)}
              onBlur={handleBlur('name')}
              className={`input ${errors.name ? 'input-error' : ''}`}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="field-error" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              onBlur={handleBlur('email')}
              className={`input ${errors.email ? 'input-error' : ''}`}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="field-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <PasswordField
            label="Password"
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => setValue('password', e.target.value)}
            onBlur={handleBlur('password')}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number."
          />

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-xs text-stone-400">
            Passwords are hashed with bcrypt — we never store them in plain text.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" state={{ from }} className="font-semibold text-teal-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
