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
    await simulateNetworkDelay(300);
    
    if (!DEMO_MODE) {
      try {
        const response = await apiClient.get('/events', { params: filters });
        if (response.data && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn("API unavailable or empty, falling back to mock events", err);
      }
    }

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
  },

  getEventById: async (id) => {
    await simulateNetworkDelay(200);
    
    if (!DEMO_MODE) {
      try {
        const response = await apiClient.get(`/events/${id}`);
        if (response.data) return response.data;
      } catch (err) {
        console.warn("Event not found on API, searching mock data", err);
      }
    }
    
    const event = eventsList.find(e => e.id === id);
    if (!event) throw new Error("Event not found");
    return event;
  },

  createEvent: async (eventData) => {
    await simulateNetworkDelay(400);
    
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
    
    if (!DEMO_MODE) {
      try {
        const response = await apiClient.post('/events', eventData);
        if (response.data) {
          eventsList.unshift(response.data);
          return response.data;
        }
      } catch (err) {
        console.warn("API create event failed, using mock data", err);
      }
    }
    
    eventsList.unshift(newEvent);
    return newEvent;
  },

  registerForEvent: async (eventId, userId = 'stud-01') => {
    await simulateNetworkDelay(300);
    
    const event = eventsList.find(e => e.id === eventId);
    if (event) {
      const alreadyRegistered = registrationsList.find(r => r.eventId === eventId && r.userId === userId && r.status !== 'cancelled');
      if (alreadyRegistered) throw new Error("Already registered for this event");
      
      if (event.availableSeats <= 0 && event.totalSeats > 0) {
        throw new Error("No seats available");
      }
      
      if (event.totalSeats > 0) {
        event.availableSeats = Math.max(0, event.availableSeats - 1);
      }
      event.registrationCount += 1;
    }
    
    const newReg = {
      id: `reg-${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      userId,
      status: "upcoming",
      attendance: null,
      feedbackSubmitted: false,
      registrationDate: new Date().toISOString().split('T')[0]
    };
    
    if (!DEMO_MODE) {
      const response = await apiClient.post(`/events/${eventId}/register`);
      return response.data;
    }
    
    registrationsList.push(newReg);
    return newReg;
  },

  getRegistrations: async (userId = 'stud-01') => {
    await simulateNetworkDelay(300);
    
    if (!DEMO_MODE) {
      try {
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
            attendance: r.attendance || null, // Assuming backend doesn't send this yet, handled separately if needed
            feedbackSubmitted: r.hasFeedback,
            feedbackRating: r.feedback?.rating,
            feedbackText: r.feedback?.comment,
            feedbackSentiment: r.feedback?.sentiment,
            registrationDate: new Date(r.registeredAt).toISOString().split('T')[0],
            event: r.event ? {
              id: r.event.id,
              title: r.event.title,
              category: r.event.category,
              date: r.event.eventDate ? new Date(r.event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming',
              time: r.event.startTime || '10:00 AM',
              venue: r.event.venue,
              image: r.event.image || r.event.posterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600",
              organizer: r.event.organizer?.name || 'Organizer'
            } : null
          };
        });
      } catch (err) {
        console.warn("API registrations unavailable, returning local data", err);
      }
    }
    
    return registrationsList
      .filter(r => r.userId === userId)
      .map(r => {
        const event = eventsList.find(e => e.id === r.eventId);
        return {
          ...r,
          event
        };
      });
  },

  cancelRegistration: async (regId) => {
    await simulateNetworkDelay(300);
    
    const reg = registrationsList.find(r => r.id === regId);
    if (reg) {
      reg.status = 'cancelled';
      const event = eventsList.find(e => e.id === reg.eventId);
      if (event && event.totalSeats > 0) {
        event.availableSeats = Math.min(event.totalSeats, event.availableSeats + 1);
        event.registrationCount = Math.max(0, event.registrationCount - 1);
      }
    }
    
    if (!DEMO_MODE) {
      try {
        const response = await apiClient.post(`/registrations/${regId}/cancel`);
        if (response.data) return response.data;
      } catch (err) {
        console.warn("API cancel failed, updated locally", err);
      }
    }
    
    return reg || { success: true };
  },

  submitFeedback: async (regId, rating, comment) => {
    await simulateNetworkDelay(400);
    
    const reg = registrationsList.find(r => r.id === regId);
    if (reg) {
      reg.feedbackSubmitted = true;
      reg.feedbackRating = rating;
      reg.feedbackText = comment;
    }
    
    const sentiment = analyzeFeedbackSentiment(comment);
    
    if (!DEMO_MODE) {
      try {
        const response = await apiClient.post(`/registrations/${regId}/feedback`, { rating, comment });
        if (response.data) return response.data;
      } catch (err) {
        console.warn("API feedback failed, computed locally", err);
      }
    }
    
    return {
      success: true,
      sentiment,
      message: "Thank you! Your feedback helps improve future events."
    };
  },

  markAttendance: async (eventId, payload) => {
    await simulateNetworkDelay(300);
    
    if (!DEMO_MODE) {
      try {
        const response = await apiClient.post(`/events/${eventId}/attendance/scan`, { payload });
        if (response.data) return response.data;
      } catch (err) {
        console.warn("API scan failed, persisting locally", err);
        if (err.response && err.response.data) {
           throw new Error(err.response.data.error || 'Scan failed');
        }
      }
    }
    
    // DEMO MODE fallback
    let studentId = payload;
    if (payload.includes(':')) {
       studentId = payload.split(':')[1];
    }
    
    const reg = registrationsList.find(r => r.eventId === eventId && r.userId === studentId && r.status !== 'cancelled');
    if (!reg) throw new Error("Student is not registered or registration is cancelled");
    
    reg.attendance = 'PRESENT';
    
    return {
      success: true,
      studentName: `Demo Student (${studentId})`,
      timestamp: new Date().toLocaleTimeString(),
      certificateUrl: `/student/events/${eventId}/certificate`,
      message: 'Attendance marked successfully. Certificate distributed.'
    };
  },

  dispatchCertificates: async (eventId, formData) => {
    // Cannot simulate network delay with formData easily if using DEMO_MODE, but we will call the API
    if (DEMO_MODE) {
      await simulateNetworkDelay(2500);
      return { success: true, count: Math.floor(Math.random() * 50) + 10 };
    }
    
    // formData must be posted directly to allow multer to parse it correctly
    const response = await apiClient.post(`/events/${eventId}/certificates/dispatch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }
};

export { eventsList, registrationsList };
