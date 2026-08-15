import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, Award, CheckCircle, TrendingUp, 
  BrainCircuit, ArrowRight, ArrowUpRight, HelpCircle, MapPin, UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { recommendationService } from '../../services/recommendationService';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recs, allEvents, regs] = await Promise.all([
          recommendationService.getRecommendationsForStudent(user?.id),
          eventService.getEvents(),
          eventService.getRegistrations(user?.id)
        ]);
        setRecommendations(recs.slice(0, 3));
        setEvents(allEvents.filter(e => !recs.find(r => r.id === e.id)).slice(0, 3));
        setRegistrations(regs);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-24 bg-slate-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-900 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-900 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Calculate engagement stats
  const registeredCount = registrations.filter(r => r.status === 'upcoming' || r.status === 'completed').length;
  const attendedCount = registrations.filter(r => r.status === 'completed' && r.attendance).length;
  const attendanceRate = user?.aiProfile?.attendanceRate || 0;
  const engagementScore = user?.aiProfile?.engagementScore || 0;

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">
            Good morning, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's your personalized event intelligence.
          </p>
        </div>

        {/* AI Profile Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold w-fit shadow-[0_0_12px_rgba(168,85,247,0.15)]">
          <BrainCircuit size={14} className="text-purple-400" />
          <span>AI Profile: {user?.aiProfile?.type || 'Highly Active'}</span>
        </div>
      </div>

      {/* Student stats metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registered', val: registeredCount, desc: 'Active events', icon: Calendar, color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Attended', val: attendedCount, desc: 'Completed list', icon: Award, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Attendance Rate', val: `${attendanceRate}%`, desc: 'Targeting >80%', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Engagement Score', val: `${engagementScore}`, desc: 'Top 10% on campus', icon: TrendingUp, color: 'text-pink-400 bg-pink-500/10' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="glass-card p-4 rounded-2xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl md:text-2xl font-extrabold font-display text-white">{stat.val}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{stat.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Row 2: AI Insights & Recommendation matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recommendations & Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400 animate-pulse" />
              Recommended For You
            </h2>
            <Link to="/student/recommendations" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="glass-card rounded-2xl flex flex-col overflow-hidden group">
                <div className="h-28 overflow-hidden relative">
                  <img src={rec.image} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-purple-600/90 text-white text-[9px] font-bold tracking-wider flex items-center gap-1 shadow-lg">
                    <Sparkles size={8} /> {rec.aiMatchPercentage}% Match
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{rec.category}</span>
                    <h3 className="font-semibold text-white text-xs truncate mt-0.5 group-hover:text-indigo-300 transition-colors" title={rec.title}>
                      {rec.title}
                    </h3>
                    <p className="text-[10px] text-purple-300 italic leading-snug mt-2 border-l border-purple-500/30 pl-2">
                      "{rec.recommendationReason}"
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">{rec.date}</span>
                    <Link 
                      to={`/student/events/${rec.id}`}
                      className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-0.5"
                    >
                      Details <ArrowUpRight size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* horizontal search discovery block */}
          <div className="flex items-center justify-between pt-4">
            <h2 className="font-display font-bold text-lg text-white">Upcoming Events</h2>
            <Link to="/student/events" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>Explore Catalog</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event.id} className="glass-card rounded-2xl flex flex-col justify-between overflow-hidden group">
                <div className="h-28 overflow-hidden relative">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 text-[9px] font-semibold">
                    {event.category}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-xs truncate mt-0.5 group-hover:text-indigo-300 transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                      <MapPin size={10} className="text-slate-500" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">{event.date}</span>
                    <Link 
                      to={`/student/events/${event.id}`}
                      className="text-[10px] font-bold text-indigo-400 flex items-center gap-0.5"
                    >
                      Register <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Assistant Card & Student Profiling */}
        <div className="space-y-6">
          {/* AI Insight Card */}
          <div className="p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <BrainCircuit size={16} className="animate-pulse" />
                <span>AI Insight</span>
              </div>
              <p className="text-xs text-purple-200 mt-3 leading-relaxed">
                You've shown a strong interest in technical workshops and hands-on coding. Three upcoming events match your activity profile.
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => navigate('/student/recommendations')}
                className="flex-1 py-2 text-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                View Matches
              </button>
              <button 
                onClick={() => navigate('/student/ai-assistant')}
                className="flex-1 py-2 text-center rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-all cursor-pointer"
              >
                Ask Assistant
              </button>
            </div>
          </div>

          {/* Student Behavior profile Card */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Your Event Profile</h3>
              <UserCheck size={14} className="text-slate-500" />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Behavior Quotient</span>
                  <span className="font-semibold text-white">Active (87% Attendance)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Technical Interest</span>
                  <span className="font-semibold text-indigo-400">High (92%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Preferred Categories</span>
              <div className="flex flex-wrap gap-1.5">
                {user?.aiProfile?.preferredCategories?.map(cat => (
                  <span key={cat} className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {cat}
                  </span>
                )) || (
                  ['AI', 'Technology', 'Workshops'].map(cat => (
                    <span key={cat} className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {cat}
                    </span>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/student/profile')}
              className="w-full py-2 text-center text-xs font-bold text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 rounded-xl hover:bg-indigo-900/20 transition-all cursor-pointer mt-2"
            >
              View My Intelligence
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default StudentDashboard;
