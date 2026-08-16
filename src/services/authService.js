import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';
import { MOCK_USERS } from './mockData';

export const authService = {
  login: async (email, password, role = 'student') => {
    await simulateNetworkDelay(600);
    
    if (DEMO_MODE) {
      // Find role matching email keyword (student, organizer, admin)
      let role = 'student';
      if (email.toLowerCase().includes('organizer') || email.toLowerCase().includes('sarah')) {
        role = 'organizer';
      } else if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('vance')) {
        role = 'admin';
      }
      
      const user = MOCK_USERS[role];
      const token = `demo-jwt-token-for-${role}`;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    }
    
    const response = await apiClient.post(`/auth/${role}/login`, { email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  },

  register: async (userData) => {
    await simulateNetworkDelay(800);
    
    if (DEMO_MODE) {
      const newUser = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'student',
        department: userData.department,
        year: userData.year || '1st Year',
        interests: [],
        skills: [],
        aiProfile: userData.role === 'student' ? {
          type: "Moderately Active",
          technicalInterest: "Medium",
          attendanceRate: 100,
          engagementScore: 75,
          preferredCategories: []
        } : null
      };
      
      const token = `demo-jwt-token-for-${newUser.role}`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser, token };
    }
    
    const rolePath = userData.role || 'student';
    const response = await apiClient.post(`/auth/${rolePath}/register`, userData);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  updateProfile: async (profileData) => {
    await simulateNetworkDelay(500);
    const currentUser = authService.getCurrentUser();
    const updated = { ...currentUser, ...profileData };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  }
};
