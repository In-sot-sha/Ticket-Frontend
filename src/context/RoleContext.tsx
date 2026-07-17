import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

type RoleType = 'USER' | 'ORGANIZER' | 'VENDOR' | 'ADMIN' | 'STAFF';

interface RoleContextType {
  currentRole: RoleType;
  setCurrentRole: (role: RoleType) => void;
  availableRoles: RoleType[];
  canSwitchToRole: (role: RoleType) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState<RoleType>('USER');

  const availableRoles: RoleType[] = ['USER'];

  if (user?.role === 'ORGANIZER' || user?.isOrganizer) {
    availableRoles.push('ORGANIZER');
  }

  if (user?.role === 'VENDOR' || user?.isVendor) {
    availableRoles.push('VENDOR');
  }

  if (user?.isStaff) {
    availableRoles.push('STAFF');
  }

  if (user?.role === 'ADMIN') {
    availableRoles.push('ADMIN');
  }

  useEffect(() => {
    if (!user) {
      setCurrentRole('USER');
      return;
    }

    if (location.pathname.startsWith('/admin')) {
      setCurrentRole('ADMIN');
      return;
    }

    if (location.pathname.startsWith('/staff')) {
      setCurrentRole('STAFF');
      if (user.isStaff || user.role === 'ADMIN') {
        localStorage.setItem('preferredRole', 'STAFF');
      }
      return;
    }

    if (location.pathname.startsWith('/organizer')) {
      setCurrentRole('ORGANIZER');
      return;
    }

    const stored = localStorage.getItem('preferredRole') as RoleType | null;
    if (stored && availableRoles.includes(stored)) {
      setCurrentRole(stored);
    } else if (user.role === 'ADMIN') {
      setCurrentRole('USER');
    } else {
      setCurrentRole('USER');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, location.pathname]);

  const handleSetCurrentRole = (role: RoleType) => {
    if (availableRoles.includes(role)) {
      setCurrentRole(role);
      localStorage.setItem('preferredRole', role);

      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'STAFF') {
        navigate('/staff');
      } else if (role === 'USER') {
        navigate('/user');
      } else if (role === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate('/');
      }
    }
  };

  const canSwitchToRole = (role: RoleType): boolean => {
    return availableRoles.includes(role);
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole: handleSetCurrentRole,
        availableRoles,
        canSwitchToRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
