import React, { useState, useEffect } from 'react';
import { recommendationService } from '../../services/recommendationService';
import { Sparkles } from 'lucide-react';
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
        <div className="h-7 w-48 bg-[#E2E8F0] rounded"></div>
        <div className="h-64 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
          <Sparkles size={22} className="text-[#4F46E5]" />
          Recommendation Analytics
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">Review recommendation conversion ratios and monitor AI click-through rates.</p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Recs Dispatched', val: metrics.generated, sub: 'Total listings shown' },
          { label: 'Impressions / Views', val: metrics.views, sub: 'Loaded cards' },
          { label: 'Clicks', val: metrics.clicks, sub: 'Click-through count' },
          { label: 'Conversions', val: metrics.registrations, sub: 'AI registration rate' }
        ].map(k => (
          <div key={k.label} className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">{k.label}</span>
            <h3 className="text-xl font-bold text-[#172033] mt-1.5">{k.val}</h3>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Recharts chart */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Base Growth vs AI-Influenced Registrations</h3>
        <div className="h-64 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.performanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="week" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
              <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="base" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Standard Registrations" />
              <Bar dataKey="ai" fill="#4F46E5" radius={[4, 4, 0, 0]} name="AI Recommended Registrations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
export default AdminRecommendations;
