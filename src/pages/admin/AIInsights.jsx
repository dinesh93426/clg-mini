import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { 
  BrainCircuit, Sparkles, AlertTriangle, AlertCircle, 
  CheckCircle, Lightbulb, BellRing, CornerDownRight, TrendingUp 
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
      case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'critical': return 'bg-rose-500/10 border-rose-500/20 text-rose-450';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      default: return 'bg-indigo-500/5 border-indigo-500/15 text-indigo-400';
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
      case 'WARNING': return <AlertTriangle size={18} className="text-amber-450" />;
      case 'TREND': return <TrendingUp size={18} className="text-emerald-450" />;
      case 'OPPORTUNITY': return <Lightbulb size={18} className="text-purple-400" />;
      default: return <BrainCircuit size={18} className="text-indigo-400 animate-pulse" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2].map(n => <div key={n} className="h-32 bg-slate-900 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
            <BrainCircuit size={26} className="text-purple-400 animate-pulse" />
            AI Insights Command Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Algorithmic observation logs identifying demand anomalies, seat overflows, and satisfaction markers.</p>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold">
          <Sparkles size={12} />
          <span>Real-time Scans: Enabled</span>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map(ins => (
          <div 
            key={ins.id}
            className={`glass-card p-5 rounded-2xl border flex flex-col justify-between space-y-4
              ${ins.severity === 'critical' ? 'border-rose-500/20' : 
                ins.severity === 'warning' ? 'border-amber-500/20' : 'border-slate-900'}`}
          >
            <div>
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2 rounded-xl bg-slate-950/40 shrink-0 mt-0.5">
                    {getInsightIcon(ins.type)}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">
                      {ins.type}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">{ins.title}</h3>
                  </div>
                </div>

                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider shrink-0
                  ${getSeverityStyle(ins.severity)}`}
                >
                  {getSeverityLabel(ins.severity)}
                </span>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed mt-4 pl-1">
                {ins.description}
              </p>
            </div>

            {/* Footer details */}
            <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-medium">Logged {ins.timestamp}</span>
              {ins.relatedEvent && (
                <div className="flex items-center gap-1 text-indigo-400 font-semibold">
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
