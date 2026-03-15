import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  loginUser, 
  registerUser, 
  refreshTokenApi, 
  logoutUser, 
  getMe, 
  setAccessToken,
  getUserProfile
} from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('refreshToken');
      if (token) {
        try {
          const { data } = await refreshTokenApi(token);
          setAccessToken(data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          
          await getMe();
          const profileRes = await getUserProfile('profile');
          setUser(profileRes.data.data);
        } catch (error) {
          console.error('Auth init failed:', error);
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data) => {
    const res = await loginUser(data);
    const { accessToken, refreshToken } = res.data.data;
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    const profileRes = await getUserProfile('profile');
    setUser(profileRes.data.data);
    return res.data;
  };

  const register = async (formData) => {
    const res = await registerUser(formData);
    const { accessToken, refreshToken } = res.data.data;
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    const profileRes = await getUserProfile('profile');
    setUser(profileRes.data.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      setAccessToken('');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
