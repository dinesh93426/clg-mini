import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';
import { MOCK_EVENTS, MOCK_ADMIN_ANALYTICS } from './mockData';

export const recommendationService = {
  getRecommendationsForStudent: async (studentId = 'stud-01') => {
    await simulateNetworkDelay(300);

    if (!DEMO_MODE) {
      try {
        const response = await apiClient.get(`/students/${studentId}/recommendations`);
        if (response.data && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn("API recommendations unavailable, falling back to mock matches", err);
      }
    }

    return MOCK_EVENTS
      .filter(e => e.aiMatchPercentage >= 70)
      .sort((a, b) => b.aiMatchPercentage - a.aiMatchPercentage);
  },

  getRecommendationIntelligence: async () => {
    await simulateNetworkDelay(300);

    if (!DEMO_MODE) {
      try {
        const response = await apiClient.get('/admin/analytics/recommendations');
        if (response.data) return response.data;
      } catch (err) {
        console.warn("API recommendation intelligence unavailable", err);
      }
    }

    return MOCK_ADMIN_ANALYTICS.recommendationMetrics;
  }
};
