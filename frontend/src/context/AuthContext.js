import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [instituteObjectId, setInstituteObjectId] = useState(null);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/verify');
          const verifiedUser = response.data.user || null;
          if (verifiedUser) {
            const normalized = {
              ...verifiedUser,
              designation: verifiedUser.designation || verifiedUser.role
            };
            setUser(normalized);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Resolve institute ObjectId once when user is set
  useEffect(() => {
    const resolveInstitute = async () => {
      if (!user?.instituteID) {
        setInstituteObjectId(null);
        return;
      }

      const instituteRef = user.instituteID;
      const rawParam = typeof instituteRef === 'object' && instituteRef !== null ? instituteRef._id : instituteRef;
      
      if (!rawParam) {
        setInstituteObjectId(null);
        return;
      }

      const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(String(rawParam));
      if (looksLikeObjectId) {
        setInstituteObjectId(rawParam);
      } else {
        try {
          const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(rawParam)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (response.ok) {
            const inst = await response.json();
            setInstituteObjectId(inst?._id || null);
          } else {
            setInstituteObjectId(null);
          }
        } catch (err) {
          console.error('Failed to resolve institute:', err);
          setInstituteObjectId(null);
        }
      }
    };

    resolveInstitute();
  }, [user, token]);

  // Resolve institute ObjectId once when user is set
  useEffect(() => {
    const resolveInstitute = async () => {
      if (!user?.instituteID) {
        setInstituteObjectId(null);
        return;
      }

      const instituteRef = user.instituteID;
      const rawParam = typeof instituteRef === 'object' && instituteRef !== null ? instituteRef._id : instituteRef;
      
      if (!rawParam) {
        setInstituteObjectId(null);
        return;
      }

      const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(String(rawParam));
      if (looksLikeObjectId) {
        setInstituteObjectId(rawParam);
      } else {
        try {
          const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(rawParam)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (response.ok) {
            const inst = await response.json();
            setInstituteObjectId(inst?._id || null);
          } else {
            setInstituteObjectId(null);
          }
        } catch (err) {
          console.error('Failed to resolve institute:', err);
          setInstituteObjectId(null);
        }
      }
    };

    resolveInstitute();
  }, [user, token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const redirectTo = error.response?.data?.redirectTo;
      return { success: false, message, redirectTo };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setInstituteObjectId(null);
  };

  // Login directly with an existing token and optional user payload
  const loginWithToken = (newToken, userData) => {
    if (!newToken) return;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (userData) {
      setUser(userData);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    loginWithToken,
    isAuthenticated: !!user,
    instituteObjectId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
