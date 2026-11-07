import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import PasswordField from '../components/PasswordField';
import { Banner } from '../components/States';
import Logo from '../components/Logo';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { user, initialising, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [values, setValues] = useState({ email: '', password: '' });
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
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!emailRe.test(value.trim())) return 'Enter a valid email address';
    }
    if (name === 'password' && !value) return 'Password is required';
    return '';
  };

  const handleBlur = (name) => () => {
    setErrors((e) => ({ ...e, [name]: validateField(name, values[name]) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      email: validateField('email', values.email),
      password: validateField('password', values.password),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setServerError('');
    try {
      await login({ email: values.email.trim(), password: values.password });
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
          <h1 className="mt-6 text-2xl font-bold text-stone-800">Welcome back</h1>
          <p className="mt-1 text-sm text-stone-500">Log in to book and manage your trips.</p>
        </div>

        {serverError && (
          <div className="mt-6">
            <Banner kind="error">{serverError}</Banner>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
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
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => setValue('password', e.target.value)}
            onBlur={handleBlur('password')}
            error={errors.password}
          />

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          New to Wanderly?{' '}
          <Link to="/signup" state={{ from }} className="font-semibold text-teal-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
