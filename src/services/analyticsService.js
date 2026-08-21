import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';

export const analyticsService = {
  getOrganizerOverview: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/organizer/analytics/overview');
    return response.data;
  },

  getAdminOverview: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/admin/analytics/overview');
    return response.data;
  },

  getStudentIntelligence: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/admin/analytics/students');
    return response.data;
  },

  getEventIntelligence: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/admin/analytics/events');
    return response.data;
  },

  getSentimentIntelligence: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/admin/analytics/feedback');
    return response.data;
  },

  getDemandPredictions: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/admin/analytics/predictions');
    return response.data;
  },

  getAIInsights: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/admin/analytics/insights');
    return response.data;
  },

  getOrganizerDashboard: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/ai/dashboard/organizer');
    return response.data;
  },

  getAdminDashboard: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/ai/dashboard/admin');
    return response.data;
  },

  getDashboardAlerts: async () => {
    await simulateNetworkDelay(200);
    try {
      const response = await apiClient.get('/ai/dashboard/alerts');
      return response.data;
    } catch (e) {
      return { alerts: [] };
    }
  },

  getDashboardEvents: async () => {
    try {
      const response = await apiClient.get('/ai/dashboard/events');
      return response.data;
    } catch (e) {
      return [];
    }
  },

  getDashboardDemand: async () => {
    try {
      const response = await apiClient.get('/ai/dashboard/demand');
      return response.data;
    } catch (e) {
      return {};
    }
  },

  getDashboardSentiment: async () => {
    try {
      const response = await apiClient.get('/ai/dashboard/sentiment');
      return response.data;
    } catch (e) {
      return {};
    }
  },

  getOrganizersList: async () => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/admin/organizers');
    return response.data;
  },

  createOrganizer: async (data) => {
    const response = await apiClient.post('/admin/organizers', data);
    return response.data;
  },

  updateOrganizer: async (id, data) => {
    const response = await apiClient.put(`/admin/organizers/${id}`, data);
    return response.data;
  },

  deleteOrganizer: async (id) => {
    const response = await apiClient.delete(`/admin/organizers/${id}`);
    return response.data;
  }
};
