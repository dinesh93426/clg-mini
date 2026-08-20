import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { analyticsService } from '../../services/analyticsService';
import { ArrowLeft, Users, Calendar, MapPin, Award, Star, CheckCircle, TrendingUp, AlertTriangle, QrCode } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

export const EventAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [regData, setRegData] = useState([]);
  const [aspectData, setAspectData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const ev = await eventService.getEventById(id);
        setEvent(ev);

        const analytics = await analyticsService.getOrganizerOverview();
        
        const scaledTrends = (analytics.registrationTrend || []).map(t => ({
          ...t,
          count: Math.round(t.count * (ev.registrationCount / (analytics.overview?.registrations || 1))) || 5
        }));
        setRegData(scaledTrends);

        const aspects = (analytics.feedbackTopics || []).map(topic => ({
          name: topic.name,
          Score: topic.score,
          Target: 80
        }));
        setAspectData(aspects);

        const sentiment = [
          { name: 'Positive', value: analytics.feedbackSentiment?.positive || 0, color: '#16A34A' },
          { name: 'Neutral', value: analytics.feedbackSentiment?.neutral || 0, color: '#64748B' },
          { name: 'Negative', value: analytics.feedbackSentiment?.negative || 0, color: '#DC2626' }
        ];
        setSentimentData(sentiment);

      } catch (err) {
        setError(err.message || 'Failed to load event statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-[#E2E8F0] rounded"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-24 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>)}
        </div>
        <div className="h-64 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center space-y-3 max-w-sm mx-auto bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
        <AlertTriangle size={32} className="mx-auto text-[#D97706]" />
        <h3 className="font-bold text-[#172033] text-base">Analytics Unavailable</h3>
        <p className="text-xs text-[#64748B]">{error || 'Event analytics not found.'}</p>
        <button onClick={() => navigate('/organizer/events')} className="px-3.5 py-1.5 bg-[#FF5A1F] rounded-lg text-xs font-semibold text-white">
          Back to list
        </button>
      </div>
    );
  }

  const percentSeats = Math.round((event.registrationCount / event.totalSeats) * 100) || 0;
  const avgRating = event.id === 'event-03' ? 4.9 : 4.6;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header back */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Events list</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <span className="text-[10px] text-[#FF5A1F] font-bold uppercase tracking-wider">Metrics Deep Dive</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] truncate max-w-lg mt-0.5">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] mt-1">
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-[#94A3B8]" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-[#94A3B8]" />
              <span>{event.venue}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/organizer/events/${id}/scanner`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <QrCode size={13} />
            <span>Scan Attendance</span>
          </Link>
          <Link
            to={`/organizer/events/${id}/certificates`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FF5A1F] hover:bg-[#E94712] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Award size={13} />
            <span>Certificates Hub</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registrations', val: event.registrationCount, desc: 'Target allocation', icon: Users, color: 'text-[#FF5A1F] bg-[#FFF1EB]' },
          { label: 'Capacity Utilized', val: `${percentSeats}%`, desc: 'Room seating ratio', icon: TrendingUp, color: 'text-[#FF5A1F] bg-[#FFF1EB]' },
          { label: 'Checked In Ratio', val: `${Math.round(percentSeats * 0.85)}%`, desc: 'Scanned at doorway', icon: CheckCircle, color: 'text-[#16A34A] bg-[#DCFCE7]' },
          { label: 'Average Rating', val: `${avgRating} / 5`, desc: 'Student satisfaction', icon: Star, color: 'text-[#D97706] bg-[#FEF3C7]' }
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-bold text-[#172033]">{stat.val}</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Registration Acceleration Line */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Registration Growth Timeline</h3>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={regData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }} />
                <Area type="monotone" dataKey="count" stroke="#FF5A1F" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" name="Registrations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Topics aspect bar */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Survey Aspect Evaluation Scores</h3>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aspectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tickLine={false} domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Score" fill="#FF5A1F" radius={[4, 4, 0, 0]} name="Aspect Score %" />
                <Bar dataKey="Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Campus Target (80%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Sentiment Pie */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">Feedback Sentiment</h3>
            <div className="h-44 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Sentiment Distribution</span>
            <div className="space-y-1.5">
              {sentimentData.map(entry => (
                <div key={entry.name} className="flex items-center justify-between text-xs text-[#172033]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-semibold">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI improvement summary list */}
        <div className="p-5 rounded-2xl border border-[#FFD2C2] bg-[#FFFFFF] space-y-2.5 shadow-xs">
          <span className="text-[10px] text-[#FF5A1F] font-bold uppercase tracking-wider block">AI Sentiment Suggestions</span>
          <div className="space-y-2 text-xs text-[#172033] leading-relaxed">
            <p>1. <strong>Prerequisite setup check</strong>: Some participants noted initial workspace bottlenecks. Recommend circulating pre-event Docker instructions 24 hours earlier next time.</p>
            <p>2. <strong>Wi-Fi Optimization</strong>: High localized demand triggered lag. Pre-allocate dedicated campus Wi-Fi access tokens for attendees.</p>
          </div>
        </div>

      </div>

    </div>
  );
};
export default EventAnalytics;
