import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { recommendationService } from '../../services/recommendationService';
import { EventCard } from '../../components/events/EventCard';
import { eventService } from '../../services/eventService';
import { Sparkles, BrainCircuit, LineChart, Award, ThumbsUp, X } from 'lucide-react';

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
      // Refresh local registrations
      const updatedRegs = await eventService.getRegistrations(user?.id);
      setRegistrations(updatedRegs);
      
      // Update seat counts in local list
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
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-80 bg-slate-900 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
            <Sparkles size={26} className="text-purple-400" />
            AI Recommendations
          </h1>
          <p className="text-slate-400 text-sm mt-1">Events custom-curated by our campus neural network matching your active profile.</p>
        </div>
        
        {/* Recommendation Intelligence Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold">
          <BrainCircuit size={14} className="text-indigo-400" />
          <span>Profile Accuracy: 94%</span>
        </div>
      </div>

      {/* Explanatory Intelligence Banner */}
      <div className="p-5 rounded-2xl border border-purple-500/15 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent flex items-start gap-4">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
          <BrainCircuit size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">How are these matches calculated?</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            We map your catalog searches, department academic tracks, self-declared programming skills, and comments sentiment index. As you register and provide ratings, the recommendations adapt dynamically to find relevant bootcamps.
          </p>
        </div>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <BrainCircuit size={32} className="mx-auto text-slate-600 animate-pulse" />
          <h3 className="text-sm font-bold text-white">Learning your profile...</h3>
          <p className="text-xs text-slate-450 max-w-sm mx-auto">
            We're still learning your interests. Register for a few events or update your profile skill list to unlock personalized matching recommendations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
