import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
  
  // Organizer-specific fields
  isOrganizerVerified?: boolean;
  organizerBusinessName?: string;
  organizerDescription?: string;
  organizerContactInfo?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
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
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on initial load and validate token
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Validate the token with the backend
        try {
          // Make a request to validate the token via the verify endpoint
          const response = await api.auth.verify();
          
          if (response.data) {
            // Token is valid, update user data if it has changed
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Token is invalid, clear the auth state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // Token validation failed, clear the auth state
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
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.auth.login({ email, password });

      if (response.data) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/');
        return true;
      } else {
        console.error('Login failed: No data in response');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data?.message || error.message);
      return false;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const response = await api.post<{ token: string; user: any }>('/users/google-login', { credential });

      if (response.data) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/');
        return true;
      } else {
        console.error('Google login failed: No data in response');
        return false;
      }
    } catch (error: any) {
      console.error('Google login error:', error.response?.data?.message || error.message);
      return false;
    }
  };

  const register = async (
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
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, logout, register, isAuthenticated, loading }}>
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