import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';
import { MOCK_EVENTS, MOCK_ADMIN_ANALYTICS } from './mockData';

export const recommendationService = {
  getRecommendationsForStudent: async (studentId = 'stud-01') => {
    await simulateNetworkDelay(400);

    if (DEMO_MODE) {
      // Return events marked as aiRecommended or sort by match percentage
      return MOCK_EVENTS
        .filter(e => e.aiMatchPercentage >= 70)
        .sort((a, b) => b.aiMatchPercentage - a.aiMatchPercentage);
    }

    const response = await apiClient.get(`/students/${studentId}/recommendations`);
    return response.data;
  },

  getRecommendationIntelligence: async () => {
    await simulateNetworkDelay(500);

    if (DEMO_MODE) {
      return MOCK_ADMIN_ANALYTICS.recommendationMetrics;
    }

    const response = await apiClient.get('/admin/analytics/recommendations');
    return response.data;
  }
};
