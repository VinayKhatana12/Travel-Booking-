import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const exploreLinks = [
  { to: '/hotels', label: 'Hotels' },
  { to: '/flights', label: 'Flights' },
];

const pageLinks = [
  { to: '/', label: 'Home', hash: false },
  { to: '/#about', label: 'About', hash: true },
  { to: '/#problem', label: 'Problem', hash: true },
  { to: '/#solution', label: 'Solution', hash: true },
  { to: '/#contact', label: 'Contact', hash: true },
];

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'text-teal-700' : 'text-stone-600 hover:text-teal-700'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
    navigate('/');
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
        <Link to="/" className="shrink-0" onClick={close} aria-label="Wanderly home">
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 lg:flex">
          {exploreLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {pageLinks.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:text-teal-700">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth area */}
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/my-trips" className="btn-secondary !px-4 !py-2">
                My Trips
              </Link>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white"
                title={user.name}
                aria-label={`Logged in as ${user.name}`}
              >
                {initial}
              </span>
              <button type="button" onClick={handleLogout} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:text-red-600">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:text-teal-700">
                Login
              </Link>
              <Link to="/signup" className="btn-primary !px-4 !py-2">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-stone-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Explore</p>
          {exploreLinks.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={close} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-teal-50 text-teal-700' : 'text-stone-700 hover:bg-stone-50'}`}>
              {l.label}
            </NavLink>
          ))}
          <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Discover Wanderly</p>
          {pageLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={close} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-stone-200 pt-3">
            {user ? (
              <>
                <Link to="/my-trips" onClick={close} className="btn-secondary">
                  My Trips
                </Link>
                <button type="button" onClick={handleLogout} className="btn-secondary !text-red-600">
                  Log out ({user.name})
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close} className="btn-secondary">
                  Login
                </Link>
                <Link to="/signup" onClick={close} className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
