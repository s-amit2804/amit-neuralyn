import { createContext, useContext, useEffect, useState } from 'react';
import { extractApiError, getStoredToken, setStoredToken } from '../services/api';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
} from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    setStoredToken(data.token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    setStoredToken(data.token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const logout = async () => {
    setStoredToken(null);
    setUser(null);
  };

  const updateUser = async (payload) => {
    try {
      const updatedUser = await updateCurrentUser(payload);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw new Error(extractApiError(error, 'Failed to update your profile.'));
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    needsOnboarding: false,
    register,
    login,
    logout,
    completeOnboarding: updateUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
