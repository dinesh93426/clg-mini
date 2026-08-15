import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';
import { MOCK_ORGANIZER_ANALYTICS, MOCK_ADMIN_ANALYTICS, MOCK_STUDENTS_LIST, MOCK_ORGANIZERS_LIST } from './mockData';

export const analyticsService = {
  getOrganizerOverview: async () => {
    await simulateNetworkDelay(500);
    if (DEMO_MODE) {
      return MOCK_ORGANIZER_ANALYTICS;
    }
    const response = await apiClient.get('/organizer/analytics/overview');
    return response.data;
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

  getOrganizersList: async () => {
    await simulateNetworkDelay(300);
    if (DEMO_MODE) {
      return MOCK_ORGANIZERS_LIST;
    }
    const response = await apiClient.get('/admin/organizers');
    return response.data;
  }
};
