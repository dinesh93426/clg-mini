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
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-[#E2E8F0] rounded-lg"></div>
        <div className="h-40 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">My Feedback</h1>
        <p className="text-xs text-[#64748B] mt-0.5">History of ratings and qualitative reviews submitted for completed campus events.</p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <AlertCircle size={22} className="text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-semibold text-[#172033]">No feedback submitted yet</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You haven't submitted feedback reviews yet. Once you attend an event, you can rate it inside <Link to="/student/registrations" className="text-[#4F46E5] hover:underline font-medium">My Registrations</Link>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEEFFA] text-[#4F46E5]">
                    {fb.event?.category || 'Event'}
                  </span>
                  
                  {/* Rating stars */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={13} 
                        fill={star <= (fb.feedbackRating || 5) ? '#D97706' : 'none'} 
                        className={star <= (fb.feedbackRating || 5) ? 'text-[#D97706]' : 'text-[#CBD5E1]'} 
                      />
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold text-xs text-[#172033] truncate mt-2">{fb.event?.title}</h3>
                
                <p className="text-xs text-[#64748B] leading-relaxed italic bg-[#F8FAFC] border-l-2 border-[#4F46E5] p-2.5 rounded-r-lg mt-2">
                  "{fb.feedbackText}"
                </p>
              </div>

              {/* Sentiment tags */}
              <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 text-[#94A3B8]">
                  <Calendar size={11} />
                  <span>Attended {fb.event?.date}</span>
                </div>

                <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border
                  ${fb.feedbackRating >= 4 ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]' : 
                    fb.feedbackRating <= 2 ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' : 
                    'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'}`}
                >
                  <Sparkles size={9} />
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
