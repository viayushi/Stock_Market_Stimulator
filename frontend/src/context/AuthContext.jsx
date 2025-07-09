import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '../services/authService';
import { getPortfolio } from '../services/portfolioService';

// Configure axios with the correct base URL
const API_BASE_URL = 'http://localhost:5000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Try to restore user from localStorage on initial load
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);

  // Set up axios defaults on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.baseURL = API_BASE_URL;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set up axios defaults
          axios.defaults.baseURL = API_BASE_URL;
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          axios.defaults.withCredentials = true;
          
          // Try to get current user from server
          try {
            const response = await getCurrentUser();
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Try to get portfolio data
            try {
              const portfolioRes = await getPortfolio();
              setPortfolio(portfolioRes.data || portfolioRes);
            } catch (portfolioError) {
              console.log('Portfolio not available yet:', portfolioError.message);
              setPortfolio(null);
            }
          } catch (userError) {
            console.error('Failed to get current user:', userError);
            // If token is invalid, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setPortfolio(null);
          }
        } else {
          setUser(null);
          setPortfolio(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setPortfolio(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const refreshPortfolio = async () => {
    try {
      const portfolioRes = await getPortfolio();
      setPortfolio(portfolioRes.data || portfolioRes);
    } catch (error) {
      console.log('Portfolio refresh failed:', error.message);
      setPortfolio(null);
    }
  };

  const login = async (userData) => {
    try {
      const response = await apiLogin(userData);
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        // Set up axios defaults
        axios.defaults.baseURL = API_BASE_URL;
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
        axios.defaults.withCredentials = true;
        
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        await refreshPortfolio();
      } else {
        throw new Error('No token received from server');
      }
      return response;
    } catch (error) {
      console.error('AuthContext login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthContext: Attempting to register user:', { ...userData, password: '[HIDDEN]' });
      const response = await apiRegister(userData);
      console.log('AuthContext: Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        } else if (error.response.data?.errors) {
          const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
          throw new Error(errorMessages);
        }
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setPortfolio(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    portfolio,
    setPortfolio,
    refreshPortfolio,
    balance: portfolio?.cash || 0
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 