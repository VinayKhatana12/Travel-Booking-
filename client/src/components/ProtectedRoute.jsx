import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './States';

/**
 * Guards protected routes. Redirects to /login while remembering where the
 * user was heading, so login returns them to the exact page (and query
 * params) afterwards.
 */
export default function ProtectedRoute({ children }) {
  const { user, initialising } = useAuth();
  const location = useLocation();

  if (initialising) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Checking your session">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}
