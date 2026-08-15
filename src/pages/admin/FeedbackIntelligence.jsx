import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Smile, Frown, Sparkles, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

export const SentimentIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSentiment = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getSentimentIntelligence();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSentiment();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="h-64 bg-slate-900 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Sentiment Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">Review aggregated review ratings and monitor feedback sentiment vectors over time.</p>
      </div>

      {/* Line Chart */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sentiment Trend Progression</h3>
        <div className="h-64 text-slate-400 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.sentimentOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
              <YAxis stroke="#64748b" tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Legend iconSize={10} verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} name="Positive Sentiment %" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="neutral" stroke="#64748b" strokeWidth={2} name="Neutral Sentiment %" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} name="Negative Sentiment %" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Positive and Negative keywords cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Positive Topics */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <h4 className="font-bold text-emerald-400 flex items-center gap-2">
            <Smile size={16} />
            <span>Top Sentiment Drivers (Positive)</span>
          </h4>
          <div className="space-y-2">
            {data.topPositiveTopics.map(topic => (
              <div key={topic} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-slate-200">
                <span>{topic}</span>
                <span className="text-[10px] text-emerald-450 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">High</span>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Topics */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <h4 className="font-bold text-rose-450 flex items-center gap-2">
            <Frown size={16} />
            <span>Key Pain Points (Negative)</span>
          </h4>
          <div className="space-y-2">
            {data.topNegativeTopics.map(topic => (
              <div key={topic} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-slate-200">
                <span>{topic}</span>
                <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">Friction</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
export default SentimentIntelligence;
