import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';

export const eventService = {
  getEvents: async (filters = {}) => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get('/events', { params: filters });
    return response.data || [];
  },

  getEventById: async (id) => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  getEventAttendees: async (id) => {
    await simulateNetworkDelay(200);
    const response = await apiClient.get(`/events/${id}/attendees`);
    return response.data || [];
  },

  createEvent: async (eventData) => {
    await simulateNetworkDelay(300);
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    await simulateNetworkDelay(300);
    const response = await apiClient.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    await simulateNetworkDelay(300);
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  },

  registerForEvent: async (eventId) => {
    await simulateNetworkDelay(300);
    const response = await apiClient.post(`/events/${eventId}/register`);
    return response.data;
  },

  getRegistrations: async () => {
    await simulateNetworkDelay(300);
    const response = await apiClient.get('/registrations');
    const data = response.data || [];
    return data.map(r => {
      const isCompleted = r.event?.status === 'COMPLETED';
      let mappedStatus = 'upcoming';
      if (r.status === 'CANCELLED') mappedStatus = 'cancelled';
      else if (isCompleted) mappedStatus = 'completed';
      
      return {
        id: r.id,
        eventId: r.eventId,
        userId: r.studentId,
        status: mappedStatus,
        attendance: r.attendance || null,
        feedbackSubmitted: r.hasFeedback,
        feedbackRating: r.feedback?.rating,
        feedbackText: r.feedback?.comment,
        feedbackSentiment: r.feedback?.sentiment,
        registrationDate: r.registeredAt ? new Date(r.registeredAt).toISOString().split('T')[0] : '',
        event: r.event ? {
          id: r.event.id,
          title: r.event.title,
          category: r.event.category,
          date: r.event.eventDate ? new Date(r.event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming',
          time: r.event.startTime || '10:00 AM',
          venue: r.event.venue,
          image: r.event.image || r.event.posterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600",
          organizer: r.event.organizer?.name || 'Organizer',
          status: r.event.status
        } : null
      };
    });
  },

  cancelRegistration: async (regId) => {
    await simulateNetworkDelay(300);
    const response = await apiClient.post(`/registrations/${regId}/cancel`);
    return response.data;
  },

  submitFeedback: async (regId, rating, comment) => {
    await simulateNetworkDelay(300);
    const response = await apiClient.post(`/registrations/${regId}/feedback`, { rating, comment });
    return response.data;
  },

  markAttendance: async (eventId, payload) => {
    await simulateNetworkDelay(300);
    const response = await apiClient.post(`/events/${eventId}/attendance/scan`, { payload });
    return response.data;
  },

  dispatchCertificates: async (eventId, formData) => {
    const response = await apiClient.post(`/events/${eventId}/certificates/dispatch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
