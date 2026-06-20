import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
  /**
   * If true, redirects authenticated users to home
   * Useful for login/register pages
   */
  redirectIfAuthenticated?: boolean;
}

/**
 * PublicRoute component
 * Allows any user to access (authenticated or not)
 * Can optionally redirect authenticated users elsewhere
 * Used for login, register, etc. pages
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children, redirectIfAuthenticated = true }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Still loading auth from storage/token verification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated and should redirect, send to home or appropriate dashboard
  if (isAuthenticated && redirectIfAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Show the route
  return <>{children}</>;
};

export default PublicRoute;
