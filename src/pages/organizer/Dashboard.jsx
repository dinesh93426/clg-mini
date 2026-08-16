import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analyticsService';
import { 
  Plus, BrainCircuit, Users, Calendar, Award, Star, 
  ArrowRight, ShieldCheck, ChevronRight, TrendingUp,
  AlertTriangle, RefreshCw, Activity, BarChart3, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

// Loading skeleton component
const Skeleton = ({ className = '' }) => (
  <div className={`bg-slate-800/60 rounded-xl animate-pulse ${className}`} />
);

export const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getOrganizerOverview();
      setAnalytics(data);
    } catch (err) {
      console.error("Error loading organizer analytics", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <Skeleton key={n} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Organizer Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Review event metrics and publish intelligence-driven drafts.</p>
          </div>
          <Link
            to="/organizer/ai-generator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-all"
          >
            <BrainCircuit size={14} className="animate-pulse" />
            <span>AI Event Generator</span>
          </Link>
        </div>

        {/* Error Card */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Analytics Unavailable</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm">
              {error || "Unable to load dashboard data. The backend may be offline."}
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const { overview, registrationTrend, attendanceTrend, categoryDistribution } = analytics;
  const PIE_COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b'];

  const kpiCards = [
    { label: 'Total Events', val: overview.totalEvents, sub: 'All campaigns', icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/15' },
    { label: 'Active Upcoming', val: overview.upcomingEvents, sub: 'Scheduled', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
    { label: 'Total Registrations', val: overview.registrations, sub: 'Confirmed seats', icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/15' },
    { label: 'Avg Attendance', val: `${overview.avgAttendance}%`, sub: 'Check-in ratio', icon: Activity, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/15' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Organizer Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Review event metrics and publish intelligence-driven drafts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            title="Refresh data"
            className="p-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
          <Link
            to="/organizer/ai-generator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-all"
          >
            <BrainCircuit size={14} className="animate-pulse" />
            <span>AI Event Generator</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`p-5 rounded-2xl bg-slate-900/40 border ${stat.border} hover:border-opacity-40 transition-all duration-300 group`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon size={14} className={stat.color} />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold font-display text-white">{stat.val}</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Registration Trend AreaChart */}
        <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Registration Trend</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Acceleration over recent period</p>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <TrendingUp size={14} className="text-indigo-400" />
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" tickLine={false} fontSize={10} />
                <YAxis stroke="#475569" tickLine={false} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', fontSize: '11px', color: '#fff' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRegs)" name="Registrations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Conversion BarChart */}
        <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attendance Conversion</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Registered vs actually attended</p>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <BarChart3 size={14} className="text-emerald-400" />
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="eventName" stroke="#475569" tickLine={false} fontSize={10} />
                <YAxis stroke="#475569" tickLine={false} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', fontSize: '11px', color: '#fff' }} />
                <Legend iconSize={8} verticalAlign="top" height={28} wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                <Bar dataKey="registered" fill="#4f46e5" radius={[3, 3, 0, 0]} name="Registered" />
                <Bar dataKey="attended" fill="#10b981" radius={[3, 3, 0, 0]} name="Attended" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Category Distribution</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', fontSize: '10px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Legend</span>
            <div className="space-y-2.5">
              {categoryDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx] }} />
                    <span className="text-slate-400">{entry.name}</span>
                  </div>
                  <span className="font-bold text-white">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-slate-900/60 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <BrainCircuit size={16} className="text-purple-400 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Sentiment Insight</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              "Overall event performance was strong. Students highly appreciated the hands-on coding labs and speaker quality. Seating capacity was the most common bottleneck."
            </p>

            {/* Mini insight metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-white/5 text-center">
                <div className="text-base font-bold text-emerald-400">84%</div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Positive</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 text-center">
                <div className="text-base font-bold text-amber-400">11%</div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Neutral</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 text-center">
                <div className="text-base font-bold text-rose-400">5%</div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Negative</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-purple-500/10">
            <Link
              to="/organizer/feedback"
              className="text-purple-400 hover:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Explore Feedback Intelligence</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
export default OrganizerDashboard;


