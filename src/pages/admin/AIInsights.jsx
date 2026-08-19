import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { 
  BrainCircuit, Sparkles, AlertTriangle, Lightbulb, TrendingUp, CornerDownRight 
} from 'lucide-react';

export const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getAIInsights();
        setInsights(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'warning': return 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]';
      case 'critical': return 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]';
      case 'success': return 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]';
      default: return 'bg-[#EEECFF] border-[#C7D2FE] text-[#4F46E5]';
    }
  };

  const getSeverityLabel = (sev) => {
    switch (sev) {
      case 'warning': return 'Moderate Warning';
      case 'critical': return 'Critical Alarm';
      case 'success': return 'Positive Trend';
      default: return 'Information';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'WARNING': return <AlertTriangle size={16} className="text-[#D97706]" />;
      case 'TREND': return <TrendingUp size={16} className="text-[#16A34A]" />;
      case 'OPPORTUNITY': return <Lightbulb size={16} className="text-[#4F46E5]" />;
      default: return <BrainCircuit size={16} className="text-[#4F46E5]" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-[#E2E8F0] rounded"></div>
        <div className="space-y-3">
          {[1, 2].map(n => <div key={n} className="h-28 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
            <BrainCircuit size={22} className="text-[#4F46E5]" />
            AI Insights Command Center
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">Automated algorithmic logs identifying demand anomalies, seating overflows, and satisfaction markers.</p>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EEECFF] border border-[#C7D2FE] text-[#4F46E5] rounded-full text-xs font-semibold self-start sm:self-auto">
          <Sparkles size={12} />
          <span>Real-time Monitoring Active</span>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map(ins => (
          <div 
            key={ins.id}
            className={`bg-[#FFFFFF] p-5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs
              ${ins.severity === 'critical' ? 'border-[#FECACA]' : 
                ins.severity === 'warning' ? 'border-[#FDE68A]' : 'border-[#E2E8F0]'}`}
          >
            <div>
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-2.5 items-start">
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] shrink-0 mt-0.5">
                    {getInsightIcon(ins.type)}
                  </div>
                  <div>
                    <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider block">
                      {ins.type}
                    </span>
                    <h3 className="text-xs font-bold text-[#172033] mt-0.5 leading-snug">{ins.title}</h3>
                  </div>
                </div>

                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shrink-0 border ${getSeverityStyle(ins.severity)}`}>
                  {getSeverityLabel(ins.severity)}
                </span>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed mt-2.5">
                {ins.description}
              </p>
            </div>

            {/* Footer details */}
            <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px]">
              <span className="text-[#94A3B8]">Logged {ins.timestamp}</span>
              {ins.relatedEvent && (
                <div className="flex items-center gap-1 text-[#4F46E5] font-semibold">
                  <CornerDownRight size={10} />
                  <span>Ref: {ins.relatedEvent}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
export default AIInsights;
