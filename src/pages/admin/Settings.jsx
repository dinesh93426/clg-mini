import React from 'react';
import { useApp } from '../../hooks/useApp';
import { Shield, Sparkles, RefreshCw, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

export const Settings = () => {
  const { demoMode, setDemoMode } = useApp();

  const handleClearCache = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    alert('Local session cache cleared. Reloading page...');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure campus operating parameters and toggle model mock engines.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-900 text-xs">
        
        {/* Toggle Mode */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-900">
          <div className="space-y-1 pr-6">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-400" />
              <span>Sandbox Demo Mode</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              When enabled, the application uses local high-fidelity simulated datasets. Disable this to link axios calls to production API servers.
            </p>
          </div>

          <button
            onClick={() => setDemoMode(!demoMode)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {demoMode ? (
              <ToggleRight size={38} className="text-indigo-500" />
            ) : (
              <ToggleLeft size={38} className="text-slate-655" />
            )}
          </button>
        </div>

        {/* Database cleanup */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-900">
          <div className="space-y-1">
            <h4 className="font-semibold text-white">Purge Local Cache</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Clears the active session tokens, dev role selections, and local memory profiles to reset initial auth states.
            </p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/20 text-rose-400 font-bold rounded-xl transition-all cursor-pointer"
          >
            Purge Cache
          </button>
        </div>

        {/* API details mock inputs */}
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-white">Intelligence API Configuration</h4>
          <div className="space-y-3">
            <div>
              <label className="text-slate-550 font-bold block mb-1 uppercase tracking-wider text-[9px]">API Endpoint URL</label>
              <input
                disabled
                type="text"
                value="https://api.collegeevents-intel.com/v1"
                className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 w-full text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-555 font-bold block mb-1 uppercase tracking-wider text-[9px]">Neural Network Weight Key</label>
              <input
                disabled
                type="password"
                value="••••••••••••••••••••••••••••••••"
                className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 w-full text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Settings;
