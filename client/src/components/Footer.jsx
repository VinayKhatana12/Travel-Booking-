import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-500">
            Hotels and flights in one place, transparent INR pricing and every trip in a single
            dashboard. Built as a full-stack demo — payments are simulated, nothing is charged.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-500">
            <li><Link to="/hotels" className="hover:text-teal-700">Hotels</Link></li>
            <li><Link to="/flights" className="hover:text-teal-700">Flights</Link></li>
            <li><Link to="/my-trips" className="hover:text-teal-700">My Trips</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-500">
            <li><Link to="/#about" className="hover:text-teal-700">About</Link></li>
            <li><Link to="/#problem" className="hover:text-teal-700">Problem we solve</Link></li>
            <li><Link to="/#solution" className="hover:text-teal-700">Solution</Link></li>
            <li><Link to="/#contact" className="hover:text-teal-700">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Wanderly — demo project. Prices in INR. Payments are simulated.
      </div>
    </footer>
  );
}
