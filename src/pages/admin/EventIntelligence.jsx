import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { BarChart3, Star, Award, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';

export const EventIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEventAnalytics = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getEventIntelligence();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEventAnalytics();
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
        <h1 className="font-display font-bold text-3xl text-white">Event Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">Review event categories performance and catalog seating check-in records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Popular events listing (span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Most Popular Campus Events</h3>
          
          <div className="space-y-3">
            {data.mostPopularEvents.map(e => (
              <div 
                key={e.title}
                className="glass-card p-4 rounded-xl border border-slate-900 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                    {e.category}
                  </span>
                  <h4 className="font-bold text-white mt-1.5 truncate max-w-[280px]">{e.title}</h4>
                </div>

                <div className="flex gap-6 items-center">
                  <div className="text-right">
                    <span className="block font-bold text-white">{e.count} registrations</span>
                    <span className="block text-[10px] text-slate-500">Total Seated</span>
                  </div>
                  
                  <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                    <Star size={12} fill="currentColor" />
                    <span>{e.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Registrations Share by category (span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registrations by Category</h3>
          <div className="glass-card p-5 rounded-2xl">
            <div className="h-64 text-slate-400 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.registrationDistribution} layout="vertical" margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="registrations" fill="#6366f1" radius={[0, 4, 4, 0]} name="Registrations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default EventIntelligence;
