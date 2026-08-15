import React, { useState, useEffect } from 'react';
import { recommendationService } from '../../services/recommendationService';
import { Sparkles, BrainCircuit, LineChart, Award } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

export const AdminRecommendations = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecAnalytics = async () => {
      setLoading(true);
      try {
        const res = await recommendationService.getRecommendationIntelligence();
        setMetrics(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadRecAnalytics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900 rounded"></div>
        <div className="h-64 bg-slate-900 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
          <Sparkles size={26} className="text-purple-400" />
          Recommendation Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Review recommendation conversion ratios and monitor AI click-through rates.</p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Recs Dispatched', val: metrics.generated, sub: 'Total listings shown' },
          { label: 'Impressions / Views', val: metrics.views, sub: 'Loaded cards' },
          { label: 'Clicks', val: metrics.clicks, sub: 'Click-through count' },
          { label: 'Conversions', val: metrics.registrations, sub: 'AI registration rate' }
        ].map(k => (
          <div key={k.label} className="glass-card p-4 rounded-xl">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{k.label}</span>
            <h3 className="text-lg md:text-xl font-extrabold font-display text-white mt-2">{k.val}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Recharts chart */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base Growth vs AI Suggs Influenced Registrations</h3>
        <div className="h-64 text-slate-450 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.performanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" tickLine={false} />
              <YAxis stroke="#64748b" tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Legend iconSize={10} verticalAlign="top" height={36} />
              <Bar dataKey="base" fill="#1e293b" radius={[4, 4, 0, 0]} name="Base Registrations" />
              <Bar dataKey="ai" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="AI Recommended Registrations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
export default AdminRecommendations;
