import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { MOCK_USERS } from '../services/mockData';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password, role = 'student') => {
    setLoading(true);
    try {
      const data = await authService.login(email, password, role);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const updated = await authService.updateProfile(profileData);
    setUser(updated);
    return updated;
  };

  // Helper for development and demo flow testing
  const switchRole = (role) => {
    const baseUser = MOCK_USERS[role] || MOCK_USERS.student;
    const mockUser = {
      ...baseUser,
      id: `dev-${role}-${Math.random().toString(36).substr(2, 4)}`,
      name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      email: `${role}@university.edu`,
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};
