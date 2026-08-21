import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Smile, Frown, Star, MessageSquare, Calendar, User, Sparkles, AlertCircle } from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

export const SentimentIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('ALL');

  useEffect(() => {
    const loadSentiment = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getSentimentIntelligence();
        setData(res);
      } catch (err) {
        console.error('Failed to load sentiment intelligence:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSentiment();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-[#E2E8F0] rounded"></div>
        <div className="h-64 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl"></div>
        <div className="h-48 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl"></div>
      </div>
    );
  }

  const eventsList = data.events || [];
  const filteredEvents = selectedEventId === 'ALL' 
    ? eventsList 
    : eventsList.filter(e => e.eventId === selectedEventId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Event-Specific Feedback Intelligence</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Granular feedback analytics, attendee reviews, and sentiment metrics partitioned per campus event.</p>
        </div>

        {eventsList.length > 0 && (
          <div className="w-full sm:w-64">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-3 py-2 w-full text-xs text-[#172033] font-medium focus:outline-none focus:border-[#FF5A1F] shadow-xs"
            >
              <option value="ALL">All College Events ({eventsList.length})</option>
              {eventsList.map(ev => (
                <option key={ev.eventId} value={ev.eventId}>
                  {ev.eventTitle} ({ev.totalFeedback} reviews)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* College Sentiment Trend Progression */}
      {data.sentimentOverTime && data.sentimentOverTime.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Campus Sentiment Trend Progression</h3>
          <div className="h-60 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sentimentOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tickLine={false} domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="positive" stroke="#16A34A" strokeWidth={2} name="Positive Sentiment %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="neutral" stroke="#64748B" strokeWidth={2} name="Neutral Sentiment %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="negative" stroke="#DC2626" strokeWidth={2} name="Negative Sentiment %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Event Feedback Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
            <MessageSquare size={14} className="text-[#FF5A1F]" />
            <span>Event Breakdown & Individual Feedback Telemetry</span>
          </h3>
          <span className="text-xs text-[#64748B] font-medium">{filteredEvents.length} events listed</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
            <AlertCircle size={24} className="mx-auto text-[#94A3B8]" />
            <h4 className="text-sm font-semibold text-[#172033]">No event feedback records found</h4>
            <p className="text-xs text-[#64748B]">Events in your college have not received attendee feedback yet.</p>
          </div>
        ) : (
          filteredEvents.map(ev => (
            <div key={ev.eventId} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-5 transition-all hover:border-[#CBD5E1]">
              
              {/* Event Header & High-Level KPIs */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-[#172033]">{ev.eventTitle}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEECFF] text-[#FF5A1F] border border-[#FFD2C2]">
                      {ev.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1"><User size={12} /> Coordinator: {ev.organizer}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ev.eventDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Score Badges */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Average Rating</div>
                    <div className="text-base font-bold text-[#172033] flex items-center justify-end gap-1">
                      <Star size={15} className="fill-[#F59E0B] text-[#F59E0B]" />
                      <span>{ev.averageRating > 0 ? `${ev.averageRating} / 5` : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E2E8F0]"></div>

                  <div className="text-right">
                    <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Feedback Turnout</div>
                    <div className="text-base font-bold text-[#172033]">
                      {ev.totalFeedback} <span className="text-xs font-normal text-[#64748B]">/ {ev.totalRegistrations} regs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment Distribution Bars */}
              {ev.totalFeedback > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#16A34A] flex items-center gap-1"><Smile size={12} /> Positive: {ev.positivePercentage}%</span>
                    <span className="text-[#64748B]">Neutral: {ev.neutralPercentage}%</span>
                    <span className="text-[#DC2626] flex items-center gap-1"><Frown size={12} /> Negative: {ev.negativePercentage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden flex">
                    <div style={{ width: `${ev.positivePercentage}%` }} className="bg-[#16A34A] h-full transition-all"></div>
                    <div style={{ width: `${ev.neutralPercentage}%` }} className="bg-[#94A3B8] h-full transition-all"></div>
                    <div style={{ width: `${ev.negativePercentage}%` }} className="bg-[#DC2626] h-full transition-all"></div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#64748B]">
                  No feedback submitted for this event yet.
                </div>
              )}

              {/* Recent Feedbacks List */}
              {ev.recentFeedbacks && ev.recentFeedbacks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#FF5A1F]" />
                    <span>Recent Student Submissions for this Event</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ev.recentFeedbacks.map(fb => (
                      <div key={fb.id} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-[#172033]">{fb.studentName} <span className="text-[10px] text-[#64748B] font-normal">• {fb.department}</span></div>
                          <div className="flex items-center gap-1 font-bold text-[#F59E0B]">
                            <Star size={11} className="fill-[#F59E0B]" />
                            <span>{fb.rating}.0</span>
                          </div>
                        </div>
                        <p className="text-[#334155] italic">"{fb.comment}"</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-[#64748B]">
                          <span className={`font-semibold px-2 py-0.5 rounded-full border ${
                            fb.sentiment === 'POSITIVE' ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]' :
                            fb.sentiment === 'NEGATIVE' ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' :
                            'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                          }`}>
                            {fb.sentiment}
                          </span>
                          <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
};
export default SentimentIntelligence;
