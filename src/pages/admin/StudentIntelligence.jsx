import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { LineChart, BarChart3, Users, Sparkles, Filter } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

export const StudentIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentAnalytics = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getStudentIntelligence();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="h-64 bg-slate-900 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const COLORS = ['#a855f7', '#6366f1', '#475569', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Student Behavior Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">Algorithmic analysis of student participation trends and cohort clusters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cluster Share Pie */}
        <div className="glass-card p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Engagement Cluster Share</h3>
            <div className="h-48 text-slate-400 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.clusters}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.clusters.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Student Clusters</span>
            <div className="space-y-2">
              {data.clusters.map((entry, idx) => (
                <div key={entry.name} className="flex items-center justify-between text-xs text-slate-350">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-semibold">{entry.value} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dept Bar chart */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active vs Inactive Cohorts by Department</h3>
          <div className="h-48 text-slate-450 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentParticipation} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dept" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} />
                <Bar dataKey="active" fill="#a855f7" radius={[4, 4, 0, 0]} name="Active Students" />
                <Bar dataKey="total" fill="#1e293b" radius={[4, 4, 0, 0]} name="Total Enrolled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Behavioral Overview */}
      <div className="p-5 rounded-2xl border border-purple-500/15 bg-gradient-to-r from-purple-500/5 to-transparent flex items-start gap-4">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1.5 text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">AI Observation Notes</h4>
          <p className="text-slate-350 leading-relaxed">
            Students in the Computer Science and Business departments exhibit a 35% higher check-in rate for hackathons compared to mechanical/civil streams. The recommendation engine has updated matches automatically to optimize registration ratios for upcoming multidisciplinary business events.
          </p>
        </div>
      </div>

    </div>
  );
};
export default StudentIntelligence;
