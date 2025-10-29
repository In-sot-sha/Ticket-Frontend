import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

type RoleType = 'USER' | 'ORGANIZER' | 'VENDOR' | 'ADMIN';

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

  // Determine available roles based on user capabilities
  const availableRoles: RoleType[] = ['USER'];
  
  // Add organizer role if user has organizer capabilities
  if (user?.role === 'ORGANIZER' || user?.isOrganizer) {
    availableRoles.push('ORGANIZER');
  }
  
  // Add vendor role if user has vendor capabilities
  if (user?.role === 'VENDOR' || user?.isVendor) {
    availableRoles.push('VENDOR');
  }
  
  // Add admin role if user is admin
  if (user?.role === 'ADMIN') {
    availableRoles.push('ADMIN');
  }

  // Determine current role from URL route
  // useEffect(() => {
  //   const pathParts = location.pathname.split('/');
  //   const dashboardIndex = pathParts.indexOf('dashboard');
    
  //   if (dashboardIndex !== -1 && pathParts.length > dashboardIndex + 1) {
  //     const roleSegment = pathParts[dashboardIndex + 1].toUpperCase() as RoleType;
      
  //     if (availableRoles.includes(roleSegment)) {
  //       setCurrentRole(roleSegment);
  //       // Save to localStorage for persistence
  //       localStorage.setItem('preferredRole', roleSegment);
  //     } else {
  //       // Default to user role if invalid role in URL
  //       const savedRole = localStorage.getItem('preferredRole') as RoleType;
  //       const defaultRole = (savedRole && availableRoles.includes(savedRole)) ? savedRole : availableRoles[0];
  //       setCurrentRole(defaultRole);
        
  //       // Redirect to correct URL
  //       if (defaultRole !== 'USER') {
  //         navigate(`/organizer`);
  //       } else {
  //         navigate('/user');
  //       }
  //     }
  //   } else if (location.pathname === '/dashboard') {
  //     // On main dashboard route, determine appropriate default
  //     const savedRole = localStorage.getItem('preferredRole') as RoleType;
  //     const defaultRole = (savedRole && availableRoles.includes(savedRole)) ? savedRole : 
  //                        (availableRoles.includes('ORGANIZER') ? 'ORGANIZER' : availableRoles[0]);
  //     setCurrentRole(defaultRole);
      
  //     // Redirect to appropriate role route
  //     if (defaultRole !== 'USER') {
  //       navigate(`/organizer`);
  //     }
  //   }
  // }, [location.pathname, user, availableRoles, navigate]);

  // Function to switch roles
  const handleSetCurrentRole = (role: RoleType) => {
    if (availableRoles.includes(role)) {
      setCurrentRole(role);
      localStorage.setItem('preferredRole', role);
      
      // Navigate to appropriate route
      if (role !== 'USER') {
        navigate(`/organizer`);
      } else {
        navigate('/user');
      }
    }
  };

  // Function to check if user can switch to a specific role
  const canSwitchToRole = (role: RoleType): boolean => {
    return availableRoles.includes(role);
  };

  return (
    <RoleContext.Provider value={{
      currentRole,
      setCurrentRole: handleSetCurrentRole,
      availableRoles,
      canSwitchToRole
    }}>
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