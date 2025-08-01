import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '../services/authService';
import { getHoldings, getPositions, getFunds, getPnL } from '../services/portfolioService';

// Configure axios with the correct base URL
const API_BASE_URL = 'http://localhost:5000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState({ holdings: [], positions: [], funds: null, pnl: [] });

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
          axios.defaults.baseURL = API_BASE_URL;
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          axios.defaults.withCredentials = true;
          try {
            const response = await getCurrentUser();
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            try {
              const [holdingsRes, positionsRes, fundsRes, pnlRes] = await Promise.all([
                getHoldings(),
                getPositions(),
                getFunds(),
                getPnL()
              ]);
              setPortfolio({
                holdings: holdingsRes.data || holdingsRes,
                positions: positionsRes.data || positionsRes,
                funds: fundsRes.data || fundsRes,
                pnl: pnlRes.data || pnlRes
              });
            } catch (portfolioError) {
              setPortfolio({ holdings: [], positions: [], funds: null, pnl: [] });
            }
          } catch (userError) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setPortfolio({ holdings: [], positions: [], funds: null, pnl: [] });
          }
        } else {
          setUser(null);
          setPortfolio({ holdings: [], positions: [], funds: null, pnl: [] });
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setPortfolio({ holdings: [], positions: [], funds: null, pnl: [] });
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const refreshPortfolio = async () => {
    try {
      const [holdingsRes, positionsRes, fundsRes, pnlRes] = await Promise.all([
        getHoldings(),
        getPositions(),
        getFunds(),
        getPnL()
      ]);
      setPortfolio({
        holdings: holdingsRes.data || holdingsRes,
        positions: positionsRes.data || positionsRes,
        funds: fundsRes.data || fundsRes,
        pnl: pnlRes.data || pnlRes
      });
    } catch (error) {
      setPortfolio({ holdings: [], positions: [], funds: null, pnl: [] });
    }
  };

  const login = async (userData) => {
    try {
      const response = await apiLogin(userData);
      if (response.token) {
        localStorage.setItem('token', response.token);
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
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      return response.data;
    } catch (error) {
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
    setPortfolio({ holdings: [], positions: [], funds: null, pnl: [] });
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
    balance: portfolio?.funds?.available_balance || 0
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