import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { recommendationService } from '../../services/recommendationService';
import { EventCard } from '../../components/events/EventCard';
import { eventService } from '../../services/eventService';
import { Sparkles, BrainCircuit, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Recommendations = () => {
  const { user } = useAuth();
  
  const [recommendations, setRecommendations] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recs, userRegs] = await Promise.all([
        recommendationService.getRecommendationsForStudent(user?.id),
        eventService.getRegistrations(user?.id)
      ]);
      setRecommendations(recs);
      setRegistrations(userRegs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    try {
      await eventService.registerForEvent(eventId, user?.id);
      const updatedRegs = await eventService.getRegistrations(user?.id);
      setRegistrations(updatedRegs);
      
      setRecommendations(prev => prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            availableSeats: Math.max(0, e.availableSeats - 1),
            registrationCount: e.registrationCount + 1
          };
        }
        return e;
      }));
    } catch (err) {
      alert(err.message || 'Seating allocation failed.');
    } finally {
      setRegisteringId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-64 bg-[#E2E8F0] rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-72 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
            <Sparkles size={20} className="text-[#FF5A1F]" />
            AI Recommendations
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">Events custom-curated by our campus neural network matching your academic profile.</p>
        </div>
        
        {/* Recommendation Intelligence Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF1EB] border border-[#FFD2C2] text-[#FF5A1F] rounded-full text-xs font-semibold w-fit">
          <BrainCircuit size={13} className="text-[#FF5A1F]" />
          <span>Profile Accuracy: 94%</span>
        </div>
      </div>

      {/* Explanatory Intelligence Banner */}
      <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-xs flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-[#FFF1EB] text-[#FF5A1F] flex items-center justify-center shrink-0">
          <BrainCircuit size={16} />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-[#172033]">How are these matches calculated?</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            We map your catalog searches, department academic tracks, self-declared programming skills, and past event attendance. Recommendations adapt dynamically to highlight relevant bootcamps and workshops.
          </p>
        </div>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <Compass size={22} className="text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-semibold text-[#172033]">Learning your profile...</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Explore events or update your profile skill list to unlock personalized matching recommendations.
          </p>
          <Link
            to="/student/events"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {recommendations.map(event => {
            const isReg = registrations.some(r => r.eventId === event.id && r.status !== 'cancelled');
            return (
              <EventCard
                key={event.id}
                event={event}
                onRegister={handleRegister}
                registered={isReg}
                registering={registeringId === event.id}
              />
            );
          })}
        </div>
      )}

    </div>
  );
};
export default Recommendations;
