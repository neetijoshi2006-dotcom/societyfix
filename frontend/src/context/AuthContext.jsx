import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Create default Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Bind token header interceptor
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Auto log out on unauthorized
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to load user session', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadMe();
  }, [token]);

  // Sign up
  const signup = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Log in
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Log out
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  // Update profile in state
  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


