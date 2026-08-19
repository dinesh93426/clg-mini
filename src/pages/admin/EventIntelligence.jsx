import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Star } from 'lucide-react';
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
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Event Intelligence</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Review event category performances and catalog seating check-in records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Popular events listing (span 7) */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Most Popular Campus Events</h3>
          
          <div className="space-y-2.5">
            {(data.mostPopularEvents || []).map(e => (
              <div 
                key={e.id || e.title}
                className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex justify-between items-center text-xs"
              >
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEECFF] text-[#FF5A1F]">
                    {e.category}
                  </span>
                  <h4 className="font-semibold text-xs text-[#172033] mt-1 truncate max-w-[260px]">{e.title}</h4>
                </div>

                <div className="flex gap-5 items-center">
                  <div className="text-right">
                    <span className="block font-bold text-[#172033]">{e.count} registrations</span>
                    <span className="block text-[10px] text-[#94A3B8]">Total Seated</span>
                  </div>
                  
                  <div className="flex items-center gap-0.5 text-[#D97706] font-bold">
                    <Star size={12} fill="currentColor" />
                    <span>{e.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Registrations Share by category (span 5) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Registrations by Category</h3>
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="h-64 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.registrationDistribution || []} layout="vertical" margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="registrations" fill="#FF5A1F" radius={[0, 4, 4, 0]} name="Registrations" />
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
