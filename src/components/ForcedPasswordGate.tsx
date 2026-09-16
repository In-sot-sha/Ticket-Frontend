import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Blocks the app until temporary-password users set a new password. */
const ForcedPasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <>{children}</>;

  if (
    isAuthenticated &&
    user?.mustChangePassword &&
    location.pathname !== '/change-password'
  ) {
    return <Navigate to="/change-password" replace />;
  }

  if (
    isAuthenticated &&
    !user?.mustChangePassword &&
    location.pathname === '/change-password'
  ) {
    return <Navigate to={user?.isStaff ? '/staff' : '/'} replace />;
  }

  return <>{children}</>;
};

export default ForcedPasswordGate;
