import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { Star, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Feedback = () => {
  const { user } = useAuth();
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeedbackHistory = async () => {
      setLoading(true);
      try {
        const regs = await eventService.getRegistrations(user?.id);
        const filtered = regs.filter(r => r.feedbackSubmitted);
        setFeedbacks(filtered);
      } catch (err) {
        console.error("Error fetching feedbacks", err);
      } finally {
        setLoading(false);
      }
    };

    loadFeedbackHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="h-40 bg-slate-900 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">My Feedback</h1>
        <p className="text-slate-400 text-sm mt-1">History of ratings and reviews submitted for completed campus events.</p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <AlertCircle size={32} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">No feedback submitted yet</h3>
          <p className="text-xs text-slate-450 max-w-sm mx-auto">
            You haven't submitted feedback reviews. Once you attend a completed event, you can rate it inside <Link to="/student/registrations" className="text-indigo-400 hover:underline">My Registrations</Link>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedbacks.map(fb => (
            <div key={fb.id} className="glass-card p-5 rounded-2xl border border-slate-900 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/15">
                    {fb.event.category}
                  </span>
                  
                  {/* Rating stars display */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={12} 
                        fill={star <= fb.feedbackRating ? '#fbbf24' : 'none'} 
                        className={star <= fb.feedbackRating ? 'text-amber-400 font-bold' : 'text-slate-650'} 
                      />
                    ))}
                  </div>
                </div>

                <h3 className="font-display font-bold text-xs text-white truncate mt-2">{fb.event.title}</h3>
                
                <p className="text-xs text-slate-300 leading-normal italic bg-slate-950/30 border-l-2 border-indigo-500/40 p-3 rounded-r-xl mt-3">
                  "{fb.feedbackText}"
                </p>
              </div>

              {/* Sentiment tags */}
              <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar size={10} />
                  <span>Attended on {fb.event.date}</span>
                </div>

                <span className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full border
                  ${fb.feedbackRating >= 4 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    fb.feedbackRating <= 2 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  <Sparkles size={8} className="text-purple-400 animate-pulse" />
                  <span>Sentiment: {fb.feedbackRating >= 4 ? 'Positive' : fb.feedbackRating <= 2 ? 'Negative' : 'Neutral'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
export default Feedback;
