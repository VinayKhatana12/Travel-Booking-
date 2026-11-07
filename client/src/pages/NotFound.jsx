import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center">
      <p className="text-8xl font-extrabold tracking-tight text-teal-600" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-stone-800">You've landed off the map.</h1>
      <p className="mt-2 max-w-md text-stone-500">
        The page you're looking for doesn't exist or may have moved. Let's get you back on
        route.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Back to home</Link>
        <Link to="/hotels" className="btn-secondary">Browse hotels</Link>
      </div>
    </div>
  );
}
