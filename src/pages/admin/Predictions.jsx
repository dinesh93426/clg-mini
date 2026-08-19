import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

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
      case 'OVERFLOW RISK': return 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]';
      case 'HIGH DEMAND': return 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]';
      case 'UNDER CAPACITY': return 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]';
      default: return 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OVERFLOW RISK': return <AlertCircle size={12} className="text-[#DC2626]" />;
      case 'HIGH DEMAND': return <AlertTriangle size={12} className="text-[#D97706]" />;
      default: return <ShieldCheck size={12} className="text-[#16A34A]" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-[#E2E8F0] rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(n => <div key={n} className="h-28 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Demand Predictions</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Review upcoming events predicted registration trends and capacity warnings.</p>
      </div>

      {/* Grid of predictive cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predictions.map(pred => {
          const ratioCurrent = Math.round((pred.currentRegistrations / pred.capacity) * 100);
          const ratioPredicted = Math.round((pred.predictedRegistrations / pred.capacity) * 100);

          return (
            <div 
              key={pred.id}
              className={`bg-[#FFFFFF] p-5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs
                ${pred.demandStatus === 'OVERFLOW RISK' ? 'border-[#FECACA]' : 'border-[#E2E8F0]'}`}
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-xs font-bold text-[#172033] truncate max-w-[260px]" title={pred.eventTitle}>
                    {pred.eventTitle}
                  </h3>
                  
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0
                    ${getStatusStyle(pred.demandStatus)}`}
                  >
                    {getStatusIcon(pred.demandStatus)} {pred.demandStatus}
                  </span>
                </div>

                <span className="text-[10px] text-[#94A3B8] font-medium block mt-1">
                  Confidence Score: {pred.confidence}
                </span>
              </div>

              {/* Progress visual meters */}
              <div className="space-y-2.5 pt-1 text-xs">
                {/* Current */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[#64748B] text-[11px]">
                    <span>Current Registrations</span>
                    <span className="font-semibold text-[#172033]">{pred.currentRegistrations} / {pred.capacity} seats ({ratioCurrent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#94A3B8] rounded-full" style={{ width: `${Math.min(100, ratioCurrent)}%` }}></div>
                  </div>
                </div>

                {/* Predicted */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[#64748B] text-[11px]">
                    <span>AI Projected Registrations</span>
                    <span className="font-semibold text-[#FF5A1F]">{pred.predictedRegistrations} seats ({ratioPredicted}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${pred.demandStatus === 'OVERFLOW RISK' ? 'bg-[#DC2626]' : 'bg-[#FF5A1F]'}`} 
                      style={{ width: `${Math.min(100, ratioPredicted)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Specific Alarms warnings */}
              {pred.demandStatus === 'OVERFLOW RISK' && (
                <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[10px] text-[#DC2626] leading-normal font-medium">
                  * <strong>Overflow Alert</strong>: Projected registrations exceed hall capacity. Consider opening a secondary session or relocating to a larger venue.
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
