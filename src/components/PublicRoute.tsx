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
 * Initial load UI is the HTML #app-boot screen in index.html
 */
const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = true,
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  // HTML boot covers until auth resolves
  if (loading) return null;

  if (isAuthenticated && redirectIfAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
