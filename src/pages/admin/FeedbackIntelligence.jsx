import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Smile, Frown } from 'lucide-react';
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
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Sentiment Intelligence</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Review aggregated review ratings and monitor feedback sentiment trends over time.</p>
      </div>

      {/* Line Chart */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Sentiment Trend Progression</h3>
        <div className="h-64 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.sentimentOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tickLine={false} domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
              <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="positive" stroke="#16A34A" strokeWidth={2} name="Positive Sentiment %" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="neutral" stroke="#64748B" strokeWidth={2} name="Neutral Sentiment %" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="negative" stroke="#DC2626" strokeWidth={2} name="Negative Sentiment %" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Positive and Negative keywords cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Positive Topics */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-3">
          <h4 className="font-bold text-[#16A34A] flex items-center gap-1.5 uppercase tracking-wider text-xs">
            <Smile size={15} />
            <span>Top Sentiment Drivers (Positive)</span>
          </h4>
          <div className="space-y-2">
            {(!data.topPositiveTopics || data.topPositiveTopics.length === 0) ? (
              <p className="text-[#94A3B8] py-2">No positive topics identified yet</p>
            ) : (
              data.topPositiveTopics.map((item, idx) => {
                const topicName = typeof item === 'object' ? item.topic : item;
                const count = typeof item === 'object' ? item.count : null;
                return (
                  <div key={idx} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[#172033]">
                    <span className="font-medium">{topicName}</span>
                    <span className="text-[10px] text-[#16A34A] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                      {count !== null ? `${count} mentions` : 'High'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Negative Topics */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-3">
          <h4 className="font-bold text-[#DC2626] flex items-center gap-1.5 uppercase tracking-wider text-xs">
            <Frown size={15} />
            <span>Key Pain Points (Negative)</span>
          </h4>
          <div className="space-y-2">
            {(!data.topNegativeTopics || data.topNegativeTopics.length === 0) ? (
              <p className="text-[#94A3B8] py-2">No negative topics identified yet</p>
            ) : (
              data.topNegativeTopics.map((item, idx) => {
                const topicName = typeof item === 'object' ? item.topic : item;
                const count = typeof item === 'object' ? item.count : null;
                return (
                  <div key={idx} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[#172033]">
                    <span className="font-medium">{topicName}</span>
                    <span className="text-[10px] text-[#DC2626] font-semibold bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                      {count !== null ? `${count} reports` : 'Moderate'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
export default SentimentIntelligence;
