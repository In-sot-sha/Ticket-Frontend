import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';
import { neonAuthClient } from '../lib/neonAuth';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // Base role ('USER', 'ORGANIZER', 'VENDOR', 'ADMIN')
  phone?: string;
  isVerified?: boolean;
  avatar?: string;
  createdAt?: string;
  
  // Multi-role capabilities
  isOrganizer?: boolean; // Whether user can act as organizer
  isVendor?: boolean;    // Whether user can act as vendor
  
  // Organization data
  ownedOrganizations?: Array<{
    id: number;
    name: string;
    description?: string;
    isVerified: boolean;
    logo?: string;
    website?: string;
    socials?: string;
    payoutBankName?: string;
    payoutAccountNumber?: string;
    payoutAccountName?: string;
    payoutSchedule?: string;
    taxId?: string;
    vatNumber?: string;
    businessAddress?: string;
    rejectionReason?: string;
    rejectedAt?: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Initialize auth only once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Prefetch user profile for faster access
        try {
          // Validate token once at startup
          const response = await api.auth.verify();
          
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            
            // Prefetch profile data for later use
            queryClient.setQueryData(
              queryKeys.auth.profile(),
              response.data
            );
          } else {
            // Token invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // Token validation failed
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.auth.login({ email, password });

      if (response.data) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Prefetch profile data
        queryClient.setQueryData(queryKeys.auth.profile(), user);
        
        return true;
      }
      return false;
    } catch (error: any) {
      throw error;
    }
  }, [queryClient]);

  const loginWithGoogle = useCallback(async (credential: string): Promise<boolean> => {
    try {
      const response = await api.post<{ token: string; user: any }>('/users/google-login', { credential });

      if (response.data) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Prefetch profile data
        queryClient.setQueryData(queryKeys.auth.profile(), user);
        
        return true;
      } else {
        console.error('Google login failed: No data in response');
        return false;
      }
    } catch (error: any) {
      console.error('Google login error:', error.response?.data?.message || error.message);
      return false;
    }
  }, [queryClient]);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> => {
    try {
      const response = await api.auth.register({ email, password, firstName, lastName });

      if (response.data) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Prefetch profile data
        queryClient.setQueryData(queryKeys.auth.profile(), user);
        
        // Send welcome email (fire and forget)
        try {
          await api.post('/emails/send-welcome', {});
        } catch (emailErr) {
          console.warn('Failed to send welcome email:', emailErr);
          // Don't fail registration if welcome email fails
        }
        
        navigate('/');
        return true;
      } else {
        console.error('Registration failed: No data in response');
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error.response?.data?.message || error.message);
      return false;
    }
  }, [navigate, queryClient]);

  const logout = useCallback(async () => {
    try {
      if (neonAuthClient) {
        await neonAuthClient.signOut();
      }
    } catch (e) {
      console.error('Error signing out of Neon Auth:', e);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear all auth-related caches
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    
    navigate('/login');
  }, [navigate, queryClient]);

  const isAuthenticated = !!token;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      loginWithGoogle,
      logout,
      register,
      updateUser,
      isAuthenticated,
      loading,
    }),
    [user, token, login, loginWithGoogle, logout, register, updateUser, isAuthenticated, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};