import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { analyticsService } from '../../services/analyticsService';
import { ArrowLeft, Users, Calendar, MapPin, Award, Star, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
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
  
  // Recharts states seeded from mock analytics
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

        // Fetch mock details
        const analytics = await analyticsService.getOrganizerOverview();
        
        // Custom scale registration trend data based on event counts
        const scaledTrends = analytics.registrationTrend.map(t => ({
          ...t,
          count: Math.round(t.count * (ev.registrationCount / analytics.overview.registrations)) || 5
        }));
        setRegData(scaledTrends);

        // Feedback aspect scores
        const aspects = analytics.feedbackTopics.map(topic => ({
          name: topic.name,
          Score: topic.score,
          Target: 80
        }));
        setAspectData(aspects);

        // Sentiment donut
        const sentiment = [
          { name: 'Positive', value: analytics.feedbackSentiment.positive, color: '#10b981' },
          { name: 'Neutral', value: analytics.feedbackSentiment.neutral, color: '#64748b' },
          { name: 'Negative', value: analytics.feedbackSentiment.negative, color: '#ef4444' }
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
        <div className="h-6 w-32 bg-slate-900 rounded"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-24 bg-slate-900 rounded-xl"></div>)}
        </div>
        <div className="h-64 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center space-y-4 max-w-sm mx-auto">
        <AlertTriangle size={32} className="mx-auto text-rose-500" />
        <h3 className="font-display font-bold text-white">Analytics Unavailable</h3>
        <p className="text-xs text-slate-400">{error || 'Event analytics not found.'}</p>
        <button onClick={() => navigate('/organizer/events')} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold text-white">
          Back to list
        </button>
      </div>
    );
  }

  const percentSeats = Math.round((event.registrationCount / event.totalSeats) * 100) || 0;
  const avgRating = event.id === 'event-03' ? 4.9 : 4.6;

  return (
    <div className="space-y-6">
      
      {/* Header back */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Events list</span>
      </button>

      <div>
        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Metrics Deep Dive</span>
        <h1 className="font-display font-bold text-2xl text-white truncate max-w-lg mt-0.5">{event.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span>{event.venue}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registrations', val: event.registrationCount, desc: 'Target allocation', icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Capacity Utilized', val: `${percentSeats}%`, desc: 'Room seating ratio', icon: TrendingUp, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Checked In Ratio', val: `${Math.round(percentSeats * 0.85)}%`, desc: 'Scanned at doorway', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Average Rating', val: `${avgRating} / 5`, desc: 'Student satisfaction', icon: Star, color: 'text-amber-400 bg-amber-500/10' }
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg md:text-xl font-extrabold font-display text-white">{stat.val}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Registration Acceleration Line */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Registration Growth Timeline</h3>
          <div className="h-64 text-slate-400 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={regData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" name="Registrations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Topics aspect bar */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Survey Aspect Evaluation Scores</h3>
          <div className="h-64 text-slate-400 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aspectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} />
                <Bar dataKey="Score" fill="#6366f1" radius={[4, 4, 0, 0]} name="Aspect Score %" />
                <Bar dataKey="Target" fill="#1e293b" radius={[4, 4, 0, 0]} name="Campus Target Benchmark (80%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Sentiment Pie */}
        <div className="glass-card p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4">Feedback Sentiment Breakdown</h3>
            <div className="h-48 text-slate-400 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Sentiment Distribution</span>
            <div className="space-y-2">
              {sentimentData.map(entry => (
                <div key={entry.name} className="flex items-center justify-between text-xs text-slate-350">
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
        <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">AI Sentiment Suggestions</span>
          <div className="space-y-2 text-xs text-slate-300">
            <p>1. **Prerequisite setup check**: Some participants noted initial workspace bottlenecks. Recommend circulating pre-event Docker instructions 24 hours earlier next time.</p>
            <p>2. **Wi-Fi Optimization**: High localized demand triggered lag. Pre-allocate dedicated campus Wi-Fi access tokens for attendees.</p>
          </div>
        </div>

      </div>

    </div>
  );
};
export default EventAnalytics;
