import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analyticsService';
import { 
  Plus, BrainCircuit, Users, Calendar, Award, Star, 
  ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

export const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getOrganizerOverview();
        setAnalytics(data);
      } catch (err) {
        console.error("Error loading organizer analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-24 bg-slate-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-900 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const { overview, registrationTrend, attendanceTrend, categoryDistribution } = analytics;
  const PIE_COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Organizer Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Review event metrics and publish intelligence-driven drafts.</p>
        </div>

        {/* AI generator Action Button */}
        <Link
          to="/organizer/ai-generator"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-all"
        >
          <BrainCircuit size={14} className="animate-pulse" />
          <span>AI Event Generator</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', val: overview.totalEvents, sub: 'All campaigns', icon: Calendar, color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Active Upcoming', val: overview.upcomingEvents, sub: 'Scheduled lists', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Registrations', val: overview.registrations, sub: 'Simulated seats', icon: Users, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Avg Attendance', val: `${overview.avgAttendance}%`, sub: 'Check-in ratios', icon: Award, color: 'text-pink-400 bg-pink-500/10' }
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl md:text-2xl font-extrabold font-display text-white">{stat.val}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Graphical Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Registration Trend AreaChart */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Registration Acceleration Trend</h3>
          <div className="h-64 text-slate-400 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRegs)" name="Registrations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Checked vs Registered BarChart */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider">Attendance Conversion Analysis</h3>
          <div className="h-64 text-slate-400 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="eventName" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} />
                <Bar dataKey="registered" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Registered" />
                <Bar dataKey="attended" fill="#10b981" radius={[4, 4, 0, 0]} name="Attended" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Category Distribution PieChart */}
        <div className="glass-card p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4">Category Distribution</h3>
            <div className="h-48 text-slate-400 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Categories Legend</span>
            <div className="space-y-2">
              {categoryDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx] }}></span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-semibold">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight highlight Card */}
        <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <BrainCircuit size={16} />
              <span>AI Sentiment Insight</span>
            </div>
            <p className="text-xs text-purple-200 leading-relaxed font-semibold">
              "Overall event performance was strong. Students highly appreciated the hands-on coding labs and speaker quality. Seating capacity was the most common bottleneck."
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-purple-500/10 flex items-center justify-between text-[11px]">
            <Link to="/organizer/feedback" className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
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
