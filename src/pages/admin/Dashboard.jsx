import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { 
  BrainCircuit, Users, Calendar, Award, ShieldAlert, Sparkles, 
  ArrowRight, TrendingUp, AlertTriangle, Lightbulb, TrendingDown, ClipboardList, ChevronRight
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [stats, list] = await Promise.all([
          analyticsService.getAdminOverview(),
          analyticsService.getAIInsights()
        ]);
        setData(stats);
        setInsights(list.slice(0, 3)); // show top 3 insights
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-24 bg-slate-900 rounded-xl"></div>)}
        </div>
        <div className="h-64 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  const { kpis } = data;

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'warning': return 'border-amber-500/20 bg-amber-500/5 text-amber-400';
      case 'critical': return 'border-rose-500/20 bg-rose-500/5 text-rose-450';
      case 'success': return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
      default: return 'border-slate-800 bg-slate-900/40 text-slate-350';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'WARNING': return <AlertTriangle size={16} className="text-amber-450" />;
      case 'TREND': return <TrendingUp size={16} className="text-emerald-450" />;
      case 'OPPORTUNITY': return <Lightbulb size={16} className="text-purple-400" />;
      default: return <BrainCircuit size={16} className="text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">AI Event Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time intelligence across the college event ecosystem.</p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Students', val: kpis.totalStudents, change: kpis.changes.students, icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Active Events', val: kpis.totalEvents, change: kpis.changes.events, icon: Calendar, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Registrations', val: kpis.totalRegistrations, change: kpis.changes.registrations, icon: ClipboardList, color: 'text-pink-400 bg-pink-500/10' },
          { label: 'Attendance Rate', val: `${kpis.attendanceRate}%`, change: kpis.changes.attendance, icon: Award, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Organizers', val: kpis.activeOrganizers, change: kpis.changes.organizers, icon: Users, color: 'text-amber-400 bg-amber-500/10' }
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass-card p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{k.label}</span>
                <div className={`p-1 rounded-lg ${k.color}`}>
                  <Icon size={12} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-lg md:text-xl font-extrabold font-display text-white">{k.val}</h3>
                <span className="text-[10px] text-emerald-450 font-semibold mt-0.5 inline-block">
                  {k.change} vs last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subpanels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: AI insights quick-board (span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <BrainCircuit size={18} className="text-purple-400 animate-pulse" />
              Active System Insights
            </h2>
            <Link to="/admin/ai-insights" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View Command Center</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-4">
            {insights.map(ins => (
              <div 
                key={ins.id}
                className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-start justify-between relative overflow-hidden transition-all hover:translate-x-0.5
                  ${getSeverityColor(ins.severity)}`}
              >
                <div className="flex gap-3 items-start">
                  <div className="p-2 rounded-xl bg-slate-950/20 mt-0.5 shrink-0">
                    {getInsightIcon(ins.type)}
                  </div>
                  <div className="space-y-1 pr-4">
                    <span className="text-[9px] font-bold tracking-widest uppercase block text-slate-500">
                      {ins.type} • Severity: {ins.severity}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1 leading-snug">{ins.title}</h4>
                    <p className="text-[11px] text-slate-350 leading-relaxed mt-1">{ins.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full text-right self-stretch shrink-0">
                  <span className="text-[9px] text-slate-500 font-semibold">{ins.timestamp}</span>
                  {ins.relatedEvent && (
                    <span className="text-[9px] font-bold text-indigo-400 mt-2 block">
                      Ref: {ins.relatedEvent.split(' ')[0]}...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Portal Shortcuts (span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="font-display font-bold text-lg text-white">Intelligence Portals</h2>
          
          <div className="glass-card rounded-2xl p-4 space-y-2 border border-slate-900">
            {[
              { name: 'Student Behavior', desc: 'Active clusters & engagement rates', path: '/admin/student-intelligence' },
              { name: 'Event Intelligence', desc: 'Top categories & seating check-ins', path: '/admin/event-intelligence' },
              { name: 'Feedback Sentiment', desc: 'Satisfaction ratings over time', path: '/admin/feedback-intelligence' },
              { name: 'AI Demand Predictions', desc: 'Overflow risks & model metrics', path: '/admin/predictions' }
            ].map(p => (
              <button
                key={p.name}
                onClick={() => navigate(p.path)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/60 border border-transparent hover:border-slate-800 text-left group transition-all cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{p.desc}</p>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
export default AdminDashboard;
