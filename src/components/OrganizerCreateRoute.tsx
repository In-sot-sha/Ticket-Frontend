import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CREATE_EVENT_PATH = '/organizer/events/create';

export function isUserOrganizer(user: {
  role?: string;
  isOrganizer?: boolean;
  ownedOrganizations?: unknown[];
} | null): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'ORGANIZER') return true;
  if (user.isOrganizer) return true;
  return (user.ownedOrganizations?.length ?? 0) > 0;
}

/**
 * Auth gate for creating/editing events under /organizer/events/create.
 * Guest → login with redirect back here.
 * Signed in but not an organizer → become-organizer with redirect.
 */
const OrganizerCreateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const target = `${location.pathname}${location.search}` || CREATE_EVENT_PATH;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(target)}`}
        replace
      />
    );
  }

  if (!isUserOrganizer(user)) {
    return (
      <Navigate
        to={`/become-organizer?redirect=${encodeURIComponent(target)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default OrganizerCreateRoute;
export { CREATE_EVENT_PATH };
