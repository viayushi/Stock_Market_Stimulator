import axios from 'axios';

// Configure axios with the correct base URL
const API_BASE_URL = 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/auth`;

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const register = async (data) => {
  try {
    console.log('Attempting to register with data:', { ...data, password: '[HIDDEN]' });
    const response = await api.post('/api/auth/register', data);
    console.log('Registration successful:', response.data);
    return response;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    
    // Handle validation errors
    if (error.response?.status === 400) {
      if (error.response.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message || err.msg).join(', ');
        throw new Error(errorMessages);
      }
    }
    
    // Handle server errors
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
};

export const login = async (data) => {
  try {
    console.log('Attempting to login with email:', data.email);
    const response = await api.post('/api/auth/login', data);
    console.log('Login successful:', response.data);
    
    // Store token if received
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Update axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error(error.response.data?.message || 'Invalid email or password.');
    }
    
    // Handle validation errors
    if (error.response?.status === 400) {
      if (error.response.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message || err.msg).join(', ');
        throw new Error(errorMessages);
      }
    }
    
    // Handle server errors
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token available');
    }
    
    const response = await api.get('/api/auth/profile');
    console.log('Get current user successful:', response.data);
    return response;
  } catch (error) {
    console.error('Get current user error:', error.response?.data || error.message);
    
    // If token is invalid, clear it
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    throw error;
  }
};