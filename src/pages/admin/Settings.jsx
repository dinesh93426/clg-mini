import React from 'react';
import { useApp } from '../../hooks/useApp';
import { Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';

export const Settings = () => {
  const { demoMode, setDemoMode } = useApp();

  const handleClearCache = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    alert('Local session cache cleared. Reloading page...');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">System Settings</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Configure campus operating parameters and toggle model mock engines.</p>
      </div>

      <div className="bg-[#FFFFFF] p-6 rounded-2xl space-y-5 border border-[#E2E8F0] shadow-xs text-xs">
        
        {/* Toggle Mode */}
        <div className="flex items-center justify-between pb-5 border-b border-[#E2E8F0]">
          <div className="space-y-1 pr-6">
            <h4 className="font-semibold text-xs text-[#172033] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#FF5A1F]" />
              <span>Sandbox Demo Mode</span>
            </h4>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              When enabled, the application uses local high-fidelity simulated datasets. Disable this to link axios calls to production API microservices.
            </p>
          </div>

          <button
            onClick={() => setDemoMode(!demoMode)}
            className="text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
          >
            {demoMode ? (
              <ToggleRight size={36} className="text-[#FF5A1F]" />
            ) : (
              <ToggleLeft size={36} className="text-[#94A3B8]" />
            )}
          </button>
        </div>

        {/* Database cleanup */}
        <div className="flex items-center justify-between pb-5 border-b border-[#E2E8F0]">
          <div className="space-y-1 pr-6">
            <h4 className="font-semibold text-xs text-[#172033]">Purge Local Cache</h4>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Clears the active session tokens, dev role selections, and local memory profiles to reset initial auth states.
            </p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-3.5 py-1.5 bg-[#FEE2E2] border border-[#FECACA] hover:bg-[#FCA5A5] text-[#DC2626] font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
          >
            Purge Cache
          </button>
        </div>

        {/* API details mock inputs */}
        <div className="space-y-3 pt-1">
          <h4 className="font-semibold text-xs text-[#172033]">Intelligence API Configuration</h4>
          <div className="space-y-3">
            <div>
              <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">API Endpoint Gateway</label>
              <input
                disabled
                type="text"
                value="http://localhost:5000/api"
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#64748B] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Neural Network ML Service</label>
              <input
                disabled
                type="text"
                value="http://localhost:8000"
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#64748B] cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Settings;
