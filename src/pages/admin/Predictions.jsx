import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { TrendingUp, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

export const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPredictions = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getDemandPredictions();
        setPredictions(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPredictions();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'OVERFLOW RISK': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.15)]';
      case 'HIGH DEMAND': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'UNDER CAPACITY': return 'bg-slate-800 text-slate-500 border border-slate-700';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OVERFLOW RISK': return <AlertCircle size={12} className="text-rose-400" />;
      case 'HIGH DEMAND': return <AlertTriangle size={12} className="text-amber-400" />;
      default: return <ShieldCheck size={12} className="text-emerald-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(n => <div key={n} className="h-32 bg-slate-900 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Demand Predictions</h1>
        <p className="text-slate-400 text-sm mt-1">Review upcoming events predicted registration trends and capacity warnings.</p>
      </div>

      {/* Grid of predictive cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map(pred => {
          const ratioCurrent = Math.round((pred.currentRegistrations / pred.capacity) * 100);
          const ratioPredicted = Math.round((pred.predictedRegistrations / pred.capacity) * 100);

          return (
            <div 
              key={pred.id}
              className={`glass-card p-5 rounded-2xl border flex flex-col justify-between space-y-4
                ${pred.demandStatus === 'OVERFLOW RISK' ? 'border-rose-500/20' : 'border-slate-900'}`}
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-sm font-bold text-white truncate max-w-[280px]" title={pred.eventTitle}>
                    {pred.eventTitle}
                  </h3>
                  
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0
                    ${getStatusStyle(pred.demandStatus)}`}
                  >
                    {getStatusIcon(pred.demandStatus)} {pred.demandStatus}
                  </span>
                </div>

                <span className="text-[9px] text-slate-500 font-semibold block mt-1.5">
                  AI Model Accuracy Roster: {pred.confidence}
                </span>
              </div>

              {/* Progress visual meters */}
              <div className="space-y-3 pt-2 text-xs">
                {/* Current */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-450">
                    <span>Current Registrations</span>
                    <span className="font-semibold text-slate-200">{pred.currentRegistrations} / {pred.capacity} seats ({ratioCurrent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-700 rounded-full" style={{ width: `${Math.min(100, ratioCurrent)}%` }}></div>
                  </div>
                </div>

                {/* Predicted */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-450">
                    <span>AI Projected Registrations</span>
                    <span className="font-semibold text-indigo-400">{pred.predictedRegistrations} seats ({ratioPredicted}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${pred.demandStatus === 'OVERFLOW RISK' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-indigo-500'}`} 
                      style={{ width: `${Math.min(100, ratioPredicted)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Specific Alarms warnings */}
              {pred.demandStatus === 'OVERFLOW RISK' && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[10px] text-rose-400 leading-normal">
                  * **Overflow Alert**: Event is projected to overshoot hall parameters. Consider launching a secondary overflow session or upgrading seating parameters.
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
export default Predictions;
