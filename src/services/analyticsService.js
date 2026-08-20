import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';
import { MOCK_ORGANIZER_ANALYTICS, MOCK_ADMIN_ANALYTICS, MOCK_STUDENTS_LIST, MOCK_ORGANIZERS_LIST } from './mockData';

export const analyticsService = {
  getOrganizerOverview: async () => {
    await simulateNetworkDelay(500);
    if (DEMO_MODE) {
      return MOCK_ORGANIZER_ANALYTICS;
    }
    try {
      const response = await apiClient.get('/organizer/analytics/overview');
      return response.data;
    } catch (e) {
      console.warn("Organizer analytics fetch failed, returning empty fallback", e);
      return {
        totalEvents: 0,
        publishedEvents: 0,
        completedEvents: 0,
        totalRegistrations: 0,
        totalAttended: 0,
        attendanceRate: 0,
        avgRating: 0,
        upcoming: [],
        categoryBreakdown: [],
        events: []
      };
    }
  },

  getAdminOverview: async () => {
    await simulateNetworkDelay(600);
    if (DEMO_MODE) {
      return MOCK_ADMIN_ANALYTICS;
    }
    const response = await apiClient.get('/admin/analytics/overview');
    return response.data;
  },

  getStudentIntelligence: async () => {
    await simulateNetworkDelay(400);
    if (DEMO_MODE) {
      return {
        clusters: MOCK_ADMIN_ANALYTICS.studentEngagement.clusters,
        departmentParticipation: MOCK_ADMIN_ANALYTICS.studentEngagement.departmentParticipation,
        students: MOCK_STUDENTS_LIST
      };
    }
    const response = await apiClient.get('/admin/analytics/students');
    return response.data;
  },

  getEventIntelligence: async () => {
    await simulateNetworkDelay(400);
    if (DEMO_MODE) {
      return MOCK_ADMIN_ANALYTICS.eventIntelligence;
    }
    const response = await apiClient.get('/admin/analytics/events');
    return response.data;
  },

  getSentimentIntelligence: async () => {
    await simulateNetworkDelay(500);
    if (DEMO_MODE) {
      return MOCK_ADMIN_ANALYTICS.sentimentIntelligence;
    }
    const response = await apiClient.get('/admin/analytics/feedback');
    return response.data;
  },

  getDemandPredictions: async () => {
    await simulateNetworkDelay(500);
    if (DEMO_MODE) {
      return MOCK_ADMIN_ANALYTICS.predictions;
    }
    const response = await apiClient.get('/admin/analytics/predictions');
    return response.data;
  },

  getAIInsights: async () => {
    await simulateNetworkDelay(400);
    if (DEMO_MODE) {
      return MOCK_ADMIN_ANALYTICS.aiInsights;
    }
    const response = await apiClient.get('/admin/analytics/insights');
    return response.data;
  },

  getOrganizerDashboard: async () => {
    try {
      const response = await apiClient.get('/ai/dashboard/organizer');
      return response.data;
    } catch (e) {
      if (DEMO_MODE) return MOCK_ORGANIZER_ANALYTICS;
      throw e;
    }
  },

  getAdminDashboard: async () => {
    try {
      const response = await apiClient.get('/ai/dashboard/admin');
      return response.data;
    } catch (e) {
      if (DEMO_MODE) return MOCK_ADMIN_ANALYTICS;
      throw e;
    }
  },

  getDashboardAlerts: async () => {
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
    await simulateNetworkDelay(300);
    if (DEMO_MODE) {
      return MOCK_ORGANIZERS_LIST;
    }
    const response = await apiClient.get('/admin/organizers');
    return response.data;
  },

  createOrganizer: async (data) => {
    // This calls the new Admin-only organizer registration endpoint
    const response = await apiClient.post('/organizer/register', data);
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
