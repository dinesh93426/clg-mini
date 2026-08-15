import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';
import { MOCK_EVENTS, MOCK_REGISTRATIONS } from './mockData';

// Maintain a mutable list in memory for Demo Mode persistence
let eventsList = [...MOCK_EVENTS];
let registrationsList = [...MOCK_REGISTRATIONS];

// Simple helper to analyze sentiment of a comment on client-side for Demo Mode
const analyzeFeedbackSentiment = (comment) => {
  const text = comment.toLowerCase();
  const positiveWords = ['great', 'good', 'excellent', 'amazing', 'loved', 'awesome', 'nice', 'helpful', 'useful', 'fantastic', 'perfect'];
  const negativeWords = ['bad', 'poor', 'boring', 'slow', 'hard', 'difficult', 'waste', 'disappointed', 'worst', 'crowded', 'wifi'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (text.includes(word)) positiveCount++;
  });
  negativeWords.forEach(word => {
    if (text.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'Positive';
  if (negativeCount > positiveCount) return 'Negative';
  return 'Neutral';
};

export const eventService = {
  getEvents: async (filters = {}) => {
    await simulateNetworkDelay(400);
    
    if (DEMO_MODE) {
      let filtered = [...eventsList];
      if (filters.category && filters.category !== 'All') {
        filtered = filtered.filter(e => e.category.toLowerCase() === filters.category.toLowerCase());
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(e => 
          e.title.toLowerCase().includes(query) || 
          e.description.toLowerCase().includes(query) ||
          e.organizer.toLowerCase().includes(query)
        );
      }
      return filtered;
    }
    
    const response = await apiClient.get('/events', { params: filters });
    return response.data;
  },

  getEventById: async (id) => {
    await simulateNetworkDelay(300);
    
    if (DEMO_MODE) {
      const event = eventsList.find(e => e.id === id);
      if (!event) throw new Error("Event not found");
      return event;
    }
    
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    await simulateNetworkDelay(500);
    
    if (DEMO_MODE) {
      const newEvent = {
        id: `event-${Math.random().toString(36).substr(2, 9)}`,
        title: eventData.title,
        description: eventData.description,
        category: eventData.category || 'Technology',
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        organizer: eventData.organizer || 'Student Committee',
        totalSeats: Number(eventData.totalSeats) || 100,
        availableSeats: Number(eventData.totalSeats) || 100,
        registrationCount: 0,
        image: eventData.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600",
        aiMatchPercentage: 70 + Math.floor(Math.random() * 25),
        recommendationReason: "Suggested event matching general interest.",
        aiRecommended: Math.random() > 0.5,
        tags: eventData.tags || ['Event']
      };
      
      eventsList.push(newEvent);
      return newEvent;
    }
    
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  registerForEvent: async (eventId, userId = 'stud-01') => {
    await simulateNetworkDelay(500);
    
    if (DEMO_MODE) {
      const event = eventsList.find(e => e.id === eventId);
      if (!event) throw new Error("Event not found");
      
      const alreadyRegistered = registrationsList.find(r => r.eventId === eventId && r.userId === userId && r.status !== 'cancelled');
      if (alreadyRegistered) throw new Error("Already registered for this event");
      
      if (event.availableSeats <= 0 && event.totalSeats > 0) {
        throw new Error("No seats available");
      }
      
      // Update event statistics
      if (event.totalSeats > 0) {
        event.availableSeats = Math.max(0, event.availableSeats - 1);
      }
      event.registrationCount += 1;
      
      const newReg = {
        id: `reg-${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        userId,
        status: "upcoming",
        attendance: null,
        feedbackSubmitted: false,
        registrationDate: new Date().toISOString().split('T')[0]
      };
      
      registrationsList.push(newReg);
      return newReg;
    }
    
    const response = await apiClient.post(`/events/${eventId}/register`);
    return response.data;
  },

  getRegistrations: async (userId = 'stud-01') => {
    await simulateNetworkDelay(400);
    
    if (DEMO_MODE) {
      return registrationsList
        .filter(r => r.userId === userId)
        .map(r => {
          const event = eventsList.find(e => e.id === r.eventId);
          return {
            ...r,
            event
          };
        });
    }
    
    const response = await apiClient.get('/registrations');
    return response.data;
  },

  cancelRegistration: async (regId) => {
    await simulateNetworkDelay(400);
    
    if (DEMO_MODE) {
      const reg = registrationsList.find(r => r.id === regId);
      if (!reg) throw new Error("Registration not found");
      
      reg.status = 'cancelled';
      
      // Restore seat
      const event = eventsList.find(e => e.id === reg.eventId);
      if (event && event.totalSeats > 0) {
        event.availableSeats = Math.min(event.totalSeats, event.availableSeats + 1);
        event.registrationCount = Math.max(0, event.registrationCount - 1);
      }
      
      return reg;
    }
    
    const response = await apiClient.post(`/registrations/${regId}/cancel`);
    return response.data;
  },

  submitFeedback: async (regId, rating, comment) => {
    await simulateNetworkDelay(500);
    
    if (DEMO_MODE) {
      const reg = registrationsList.find(r => r.id === regId);
      if (!reg) throw new Error("Registration not found");
      
      reg.feedbackSubmitted = true;
      reg.feedbackRating = rating;
      reg.feedbackText = comment;
      
      const sentiment = analyzeFeedbackSentiment(comment);
      
      return {
        success: true,
        sentiment,
        message: "Thank you! Your feedback helps improve future events."
      };
    }
    
    const response = await apiClient.post(`/registrations/${regId}/feedback`, { rating, comment });
    return response.data;
  }
};
export { eventsList, registrationsList };
