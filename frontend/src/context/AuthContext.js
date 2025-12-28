import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE, apiUrl } from '../utils/api';

// Configure axios baseURL (empty means use relative URLs + CRA proxy)
axios.defaults.baseURL = API_BASE;

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
  // Cache: institute info and subscription status to avoid refetch on simple navigations
  const [instituteCache, setInstituteCache] = useState(null);
  const [subscriptionCache, setSubscriptionCache] = useState(null);
  const [paymentsHistoryCache, setPaymentsHistoryCache] = useState(null);

  // Color presets for theme
  const colorPresets = [
    { name: 'Purple', value: '#7c3aed', light: '#ede9fe', dark: '#5b21b6' },
    { name: 'Blue', value: '#2563eb', light: '#dbeafe', dark: '#1e40af' },
    { name: 'Emerald', value: '#059669', light: '#d1fae5', dark: '#047857' }
  ];

  // Apply theme from localStorage immediately on mount (before API calls)
  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        console.log('🎨 Restoring theme from localStorage:', theme);
        document.documentElement.style.setProperty('--theme-color', theme.value);
        document.documentElement.style.setProperty('--theme-color-light', theme.light);
        document.documentElement.style.setProperty('--theme-color-dark', theme.dark);
      } catch (error) {
        console.error('Failed to parse saved theme:', error);
      }
    }
  }, []);

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
          const response = await fetch(apiUrl(`/api/auth/institute/${encodeURIComponent(rawParam)}`), {
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
          const response = await fetch(apiUrl(`/api/auth/institute/${encodeURIComponent(rawParam)}`), {
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

  // Lightweight data loaders with caching (memoized for stable identity)
  const loadInstituteOnce = useCallback(async (instituteID) => {
    if (!instituteID) return null;
    if (instituteCache && instituteCache.instituteID === instituteID) return instituteCache;
    try {
      const res = await axios.get(`/api/auth/institute/${encodeURIComponent(instituteID)}`);
      setInstituteCache(res.data);
      // Apply theme color with all variants
      if (res.data?.themeColor) {
        const selectedColor = colorPresets.find(c => c.value === res.data.themeColor) || colorPresets[0];
        console.log('🔄 loadInstituteOnce - Applying theme:', selectedColor.name, selectedColor);
        document.documentElement.style.setProperty('--theme-color', selectedColor.value);
        document.documentElement.style.setProperty('--theme-color-light', selectedColor.light);
        document.documentElement.style.setProperty('--theme-color-dark', selectedColor.dark);
        // Save to localStorage
        localStorage.setItem('appTheme', JSON.stringify(selectedColor));
      }
      return res.data;
    } catch {
      return null;
    }
  }, [instituteCache, colorPresets])
  const loadSubscriptionOnce = useCallback(async (instituteID) => {
    if (!instituteID) return null;
    if (subscriptionCache && subscriptionCache._for === instituteID) return subscriptionCache;
    try {
      const res = await axios.get(`/api/subscription/status/${encodeURIComponent(instituteID)}`);
      const data = { ...res.data, _for: instituteID };
      setSubscriptionCache(data);
      return data;
    } catch {
      return null;
    }
  }, [subscriptionCache]);

  const loadPaymentsHistoryOnce = useCallback(async (instituteID) => {
    if (!instituteID) return null;
    if (paymentsHistoryCache && paymentsHistoryCache._for === instituteID) return paymentsHistoryCache;
    try {
      const res = await axios.get(`/api/payments/history/${encodeURIComponent(instituteID)}`);
      const data = { items: res.data?.items || [], _for: instituteID };
      setPaymentsHistoryCache(data);
      return data;
    } catch {
      return null;
    }
  }, [paymentsHistoryCache]);

  // Force refresh institute cache
  const refreshInstituteData = useCallback(async (instituteID) => {
    if (!instituteID) return null;
    try {
      const res = await axios.get(`/api/auth/institute/${encodeURIComponent(instituteID)}`);
      setInstituteCache(res.data);
      // Apply theme color with all variants
      if (res.data?.themeColor) {
        const selectedColor = colorPresets.find(c => c.value === res.data.themeColor) || colorPresets[0];
        console.log('🔄 refreshInstituteData - Applying theme:', selectedColor.name, selectedColor);
        document.documentElement.style.setProperty('--theme-color', selectedColor.value);
        document.documentElement.style.setProperty('--theme-color-light', selectedColor.light);
        document.documentElement.style.setProperty('--theme-color-dark', selectedColor.dark);
        // Save to localStorage
        localStorage.setItem('appTheme', JSON.stringify(selectedColor));
      }
      return res.data;
    } catch {
      return null;
    }
  }, [colorPresets]);

  // Force refresh subscription cache
  const refreshSubscriptionData = useCallback(async (instituteID) => {
    if (!instituteID) return null;
    try {
      const res = await axios.get(`/api/subscription/status/${encodeURIComponent(instituteID)}`);
      const data = { ...res.data, _for: instituteID };
      setSubscriptionCache(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  // Force refresh payments history cache
  const refreshPaymentsHistory = useCallback(async (instituteID) => {
    if (!instituteID) return null;
    try {
      const res = await axios.get(`/api/payments/history/${encodeURIComponent(instituteID)}`);
      const data = { items: res.data?.items || [], _for: instituteID };
      setPaymentsHistoryCache(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // Fetch and cache theme immediately after login
      if (userData?.instituteID) {
        try {
          const instituteRes = await axios.get(`/api/auth/institute/${encodeURIComponent(userData.instituteID)}`, {
            headers: { 'Authorization': `Bearer ${newToken}` }
          });
          
          if (instituteRes.data?.themeColor) {
            // Check if it matches a preset
            let selectedColor = colorPresets.find(c => c.value.toLowerCase() === instituteRes.data.themeColor.toLowerCase());
            
            // If no match, create custom color object
            if (!selectedColor) {
              console.log('🎨 Custom color detected:', instituteRes.data.themeColor);
              const customColor = instituteRes.data.themeColor;
              
              // Generate light and dark variants for custom color
              selectedColor = {
                name: 'Custom',
                value: customColor,
                light: customColor + '26', // Add 15% opacity for light variant
                dark: customColor
              };
            }
            
            console.log('🎨 Login - Applying theme:', selectedColor.name, selectedColor.value);
            
            // Apply theme immediately
            document.documentElement.style.setProperty('--theme-color', selectedColor.value);
            document.documentElement.style.setProperty('--theme-color-light', selectedColor.light);
            document.documentElement.style.setProperty('--theme-color-dark', selectedColor.dark);
            
            // Save to localStorage for future use
            localStorage.setItem('appTheme', JSON.stringify(selectedColor));
          }
        } catch (themeError) {
          console.error('Failed to fetch theme on login:', themeError);
        }
      }
      
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
    // expose caches and loaders
    instituteCache,
    subscriptionCache,
    paymentsHistoryCache,
    loadInstituteOnce,
    loadSubscriptionOnce,
    loadPaymentsHistoryOnce,
    // expose refresh methods
    refreshInstituteData,
    refreshSubscriptionData,
    refreshPaymentsHistory,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
