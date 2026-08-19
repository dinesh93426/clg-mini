import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Calendar, Award, CheckCircle, TrendingUp, 
  BrainCircuit, ArrowRight, ArrowUpRight, MapPin, UserCheck,
  Compass
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
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-[#E2E8F0] rounded-lg" />
            <div className="h-4 w-48 bg-[#E2E8F0] rounded-md" />
          </div>
          <div className="h-8 w-40 bg-[#E2E8F0] rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-xl h-28" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl" />
          <div className="h-72 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculate engagement stats
  const registeredCount = registrations.filter(r => r.status === 'upcoming' || r.status === 'completed').length;
  const attendedCount = registrations.filter(r => r.status === 'completed' && r.attendance).length;
  const attendanceRate = user?.aiProfile?.attendanceRate || 0;
  const engagementScore = user?.aiProfile?.engagementScore || 0;

  const statMetrics = [
    { 
      label: 'REGISTERED', 
      val: registeredCount, 
      desc: 'Active registrations', 
      trend: '↑ 12%',
      icon: Calendar, 
      iconBg: 'bg-[#EEF2FF] text-[#4F46E5]' 
    },
    { 
      label: 'ATTENDED', 
      val: attendedCount, 
      desc: 'Completed events', 
      trend: '↑ 8%',
      icon: Award, 
      iconBg: 'bg-[#EEF2FF] text-[#4F46E5]' 
    },
    { 
      label: 'ATTENDANCE RATE', 
      val: `${attendanceRate}%`, 
      desc: 'Targeting >80%', 
      trend: attendanceRate >= 80 ? 'Target Met' : 'In Progress',
      icon: CheckCircle, 
      iconBg: 'bg-[#DCFCE7] text-[#16A34A]' 
    },
    { 
      label: 'ENGAGEMENT SCORE', 
      val: `${engagementScore}`, 
      desc: 'Top 10% on campus', 
      trend: 'Top 10%',
      icon: TrendingUp, 
      iconBg: 'bg-[#FEF3C7] text-[#D97706]' 
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            Good morning, {user?.name ? user.name.split(' ')[0] : 'Student'}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Personalized event recommendations, registration schedule, and AI intelligence.
          </p>
        </div>

        {/* AI Profile Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-xs font-semibold w-fit">
          <BrainCircuit size={13} className="text-[#4F46E5]" />
          <span>AI Profile: {user?.aiProfile?.type || 'Highly Active'}</span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statMetrics.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                  <Icon size={16} />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-2xl font-bold text-[#172033] tracking-tight">
                    {stat.val}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                    {stat.trend}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  {stat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Recommendations & Upcoming Events */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Recommended For You */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#172033] flex items-center gap-2">
                <Sparkles size={16} className="text-[#4F46E5]" />
                Recommended For You
              </h2>
              <Link 
                to="/student/recommendations" 
                className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 transition-colors"
              >
                <span>View all matches</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-6 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                <Compass size={20} className="text-[#94A3B8] mx-auto" />
                <h4 className="text-xs font-semibold text-[#172033]">No recommendations yet</h4>
                <p className="text-[11px] text-[#64748B]">Explore the catalog to unlock personalized AI matches.</p>
                <Link
                  to="/student/events"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] pt-1"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
                  >
                    <div className="h-28 overflow-hidden relative bg-[#EEF2FF]">
                      <img 
                        src={rec.image || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600"} 
                        alt={rec.title} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600";
                        }}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#FFFFFF]/95 text-[#4F46E5] text-[10px] font-bold shadow-xs border border-[#E2E8F0]">
                        {rec.aiMatchPercentage}% Match
                      </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#EEF2FF] text-[#4F46E5]">
                          {rec.category}
                        </span>
                        <h3 className="font-semibold text-[#172033] text-xs leading-snug truncate mt-1.5" title={rec.title}>
                          {rec.title}
                        </h3>
                        <p className="text-[10px] text-[#64748B] italic leading-relaxed mt-1 line-clamp-2">
                          "{rec.recommendationReason}"
                        </p>
                      </div>
                      
                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] text-[#94A3B8]">{rec.date}</span>
                        <Link 
                          to={`/student/events/${rec.id}`}
                          className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5"
                        >
                          <span>Details</span>
                          <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Upcoming Events */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#172033]">Upcoming Events</h2>
              <Link 
                to="/student/events" 
                className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 transition-colors"
              >
                <span>Browse all</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="p-6 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <p className="text-xs text-[#64748B]">No upcoming events scheduled right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
                  >
                    <div className="h-28 overflow-hidden relative bg-[#EEF2FF]">
                      <img 
                        src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600"} 
                        alt={event.title} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600";
                        }}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#FFFFFF]/90 text-[#64748B] text-[9px] font-semibold border border-[#E2E8F0]">
                        {event.category}
                      </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-semibold text-[#172033] text-xs leading-snug truncate" title={event.title}>
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-1">
                          <MapPin size={11} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] text-[#94A3B8]">{event.date}</span>
                        <Link 
                          to={`/student/events/${event.id}`}
                          className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1"
                        >
                          <span>Register</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Insight Panel & Event Profile */}
        <div className="space-y-6">
          
          {/* AI Insight Panel */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#4F46E5] text-xs font-bold uppercase tracking-wider">
              <BrainCircuit size={15} />
              <span>AI Intelligence Insight</span>
            </div>

            <p className="text-xs text-[#172033] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              You've shown a strong interest in technical workshops and hands-on coding. Three upcoming events match your activity profile.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => navigate('/student/recommendations')}
                className="flex-1 py-2 px-3 text-center rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                View Matches
              </button>
              <button 
                onClick={() => navigate('/student/ai-assistant')}
                className="flex-1 py-2 px-3 text-center rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172033] text-xs font-semibold transition-colors cursor-pointer"
              >
                Ask Assistant
              </button>
            </div>
          </div>

          {/* Event Profile Panel */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">Your Event Profile</h3>
              <UserCheck size={15} className="text-[#94A3B8]" />
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                  <span>Behavior Quotient</span>
                  <span className="font-semibold text-[#172033]">Active (87% Attendance)</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                  <span>Technical Interest</span>
                  <span className="font-semibold text-[#4F46E5]">High (92%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>

            {/* Preferred Category Tags */}
            <div className="pt-2">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-2">
                Preferred Categories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(user?.aiProfile?.preferredCategories && user.aiProfile.preferredCategories.length > 0
                  ? user.aiProfile.preferredCategories
                  : ['AI & ML', 'Web Development', 'Design', 'Workshops']
                ).map((cat) => (
                  <span 
                    key={cat} 
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/student/profile')}
              className="w-full py-2 text-center text-xs font-medium text-[#4F46E5] bg-[#F8FAFC] hover:bg-[#EEF2FF] border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
            >
              View Full Profile
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
export default StudentDashboard;
