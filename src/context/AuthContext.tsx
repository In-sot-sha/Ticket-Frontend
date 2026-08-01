import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';
import { neonAuthClient, markLoggedOut, clearLoggedOutFlag } from '../lib/neonAuth';
import { isTokenExpired, getTokenTimeRemaining } from '../lib/tokenUtils';
import { dismissAppBoot } from '../lib/appBoot';

interface User {
  id: number;
  email?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  isVerified?: boolean;
  avatar?: string;
  createdAt?: string;
  isOrganizer?: boolean;
  isVendor?: boolean;
  isStaff?: boolean;
  mustChangePassword?: boolean;
  vendorProfile?: any;
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
    absorbFee?: boolean;
    paystackSubaccountCode?: string;
    rejectionReason?: string;
    rejectedAt?: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => void;
  register: (
    email: string | null,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string | null
  ) => Promise<boolean>;
  updateUser: (updatedUser: User) => void;
  attemptTokenRefresh: () => Promise<boolean>;
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
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Instant local logout — clear Neon session so Login cannot silently re-auth
  const logout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    markLoggedOut();
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('preferredRole');

    queryClient.clear();

    let navigated = false;
    const goLogin = () => {
      if (navigated) return;
      navigated = true;
      navigate('/login', { replace: true });
    };

    if (neonAuthClient) {
      const timeout = window.setTimeout(goLogin, 2500);
      void neonAuthClient
        .signOut()
        .catch((e) => {
          console.error('Error signing out of Neon Auth:', e);
        })
        .finally(() => {
          window.clearTimeout(timeout);
          goLogin();
        });
      return;
    }

    goLogin();
  }, [navigate, queryClient]);

  /**
   * Schedule proactive token refresh before expiration
   * Mimics Airbnb's silent refresh — happens before user notices
   */
  const scheduleTokenRefresh = useCallback((currentToken: string, onRefresh?: (newToken: string) => void): void => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const timeRemaining = getTokenTimeRemaining(currentToken);
    if (!timeRemaining || timeRemaining <= 0) return;

    // Refresh 2 minutes before expiration (or halfway through, whichever is sooner)
    const refreshThreshold = Math.min(120000, timeRemaining / 2);
    const refreshDelay = Math.max(10000, timeRemaining - refreshThreshold);

    console.log(`[Auth] Scheduling token refresh in ${Math.round(refreshDelay / 1000)} seconds`);

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('[Auth] Proactively refreshing token...');
      if (!isRefreshingRef.current && currentToken) {
        isRefreshingRef.current = true;
        try {
          const response = await api.post<{ 
            accessToken: string; 
            refreshToken?: string; 
            user: any 
          }>('/users/refresh-token', { token: currentToken });
          
          if (response.data) {
            const { accessToken, user: updatedUser } = response.data;
            setToken(accessToken);
            setUser(updatedUser);
            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update query cache
            queryClient.setQueryData(queryKeys.auth.profile(), updatedUser);
            
            console.log('[Auth] Token refreshed proactively');
            
            // Schedule next refresh
            scheduleTokenRefresh(accessToken, onRefresh);
            if (onRefresh) onRefresh(accessToken);
          }
        } catch (error) {
          console.error('[Auth] Proactive token refresh failed:', error);
          logout();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }, refreshDelay);
  }, [logout, queryClient]);

  /**
   * Attempt to refresh token when a request fails (reactive refresh)
   */
  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    if (!token || isRefreshingRef.current) return false;

    isRefreshingRef.current = true;
    try {
      const response = await api.post<{ 
        accessToken: string; 
        refreshToken?: string; 
        user: any 
      }>('/users/refresh-token', { token });
      
      if (response.data) {
        const { accessToken, user: updatedUser } = response.data;
        setToken(accessToken);
        setUser(updatedUser);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update query cache
        queryClient.setQueryData(queryKeys.auth.profile(), updatedUser);
        
        console.log('[Auth] Token refreshed successfully');
        
        // Schedule next proactive refresh
        scheduleTokenRefresh(accessToken);
        
        return true;
      }
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      logout();
    } finally {
      isRefreshingRef.current = false;
    }
    
    return false;
  }, [token, logout, queryClient, scheduleTokenRefresh]);

  // Initialize auth only once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        // Check if token is expired
        if (isTokenExpired(storedToken, 0)) {
          console.warn('[Auth] Stored token has expired. Attempting refresh...');
          
          // Try to refresh the expired token silently
          try {
            const response = await api.post<{ 
              accessToken: string; 
              refreshToken?: string; 
              user: any 
            }>('/users/refresh-token', { token: storedToken });
            
            if (response.data) {
              const { accessToken, user: updatedUser } = response.data;
              setToken(accessToken);
              setUser(updatedUser);
              localStorage.setItem('token', accessToken);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              // Schedule next refresh
              scheduleTokenRefresh(accessToken);
              
              console.log('[Auth] Token refreshed successfully on app startup');
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('[Auth] Token refresh failed on startup:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        // Token is still valid
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Schedule proactive refresh before expiration
        scheduleTokenRefresh(storedToken);
        
        // Validate token once at startup
        try {
          const response = await api.auth.verify();
          
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            
            queryClient.setQueryData(
              queryKeys.auth.profile(),
              response.data
            );
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.warn('[Auth] Token validation failed on startup:', error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide the HTML boot screen (index.html) once auth has resolved
  useEffect(() => {
    if (!loading) dismissAppBoot();
  }, [loading]);

  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    try {
      const response = await api.auth.login({ identifier, password });

      if (response.data) {
        const { token: newToken, user: userData } = response.data;
        clearLoggedOutFlag();
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        queryClient.setQueryData(queryKeys.auth.profile(), userData);
        scheduleTokenRefresh(newToken);
        
        return true;
      }
      return false;
    } catch (error: any) {
      throw error;
    }
  }, [queryClient, scheduleTokenRefresh]);

  const loginWithGoogle = useCallback(async (credential: string): Promise<boolean> => {
    try {
      const response = await api.post<{ token: string; user: any }>('/users/google-login', { credential });

      if (response.data) {
        const { token: newToken, user: userData } = response.data;
        clearLoggedOutFlag();
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        queryClient.setQueryData(queryKeys.auth.profile(), userData);
        scheduleTokenRefresh(newToken);
        
        return true;
      } else {
        console.error('Google login failed: No data in response');
        return false;
      }
    } catch (error: any) {
      console.error('Google login error:', error.response?.data?.message || error.message);
      return false;
    }
  }, [queryClient, scheduleTokenRefresh]);

  const register = useCallback(async (
    email: string | null,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string | null
  ): Promise<boolean> => {
    try {
      const response = await api.auth.register({
        email: email || undefined,
        phone: phone || undefined,
        password,
        firstName,
        lastName,
      });

      if (response.data) {
        const { token: newToken, user: userData } = response.data;
        clearLoggedOutFlag();
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        queryClient.setQueryData(queryKeys.auth.profile(), userData);
        scheduleTokenRefresh(newToken);
        
        try {
          if (userData.email) {
            await api.post('/emails/send-welcome', {});
          }
        } catch (emailErr) {
          console.warn('Failed to send welcome email:', emailErr);
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
  }, [navigate, queryClient, scheduleTokenRefresh]);

  const isAuthenticated = !!token;

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      loginWithGoogle,
      logout,
      register,
      updateUser,
      attemptTokenRefresh,
      isAuthenticated,
      loading,
    }),
    [user, token, login, loginWithGoogle, logout, register, updateUser, attemptTokenRefresh, isAuthenticated, loading]
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
