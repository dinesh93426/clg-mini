import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, BrainCircuit, BarChart3, Users, Compass, 
  CalendarRange, CheckCircle2, ArrowRight, ShieldAlert, Cpu
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div className="bg-[#0b0f19] text-white min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-900/60 sticky top-0 bg-[#0b0f19]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <BrainCircuit size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">
            EventIntel <span className="text-indigo-400">AI</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleStart}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={handleStart}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center relative overflow-hidden">
        {/* Abstract blur background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl -z-10"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 mb-6 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <Sparkles size={12} className="animate-spin-slow" />
            <span>AI-Powered Event Analytics Platform</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Event Management <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              for Smarter Campuses
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Understand student behavior, create better events, personalize recommendations, and turn feedback into actionable intelligence.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Explore Platform</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              See AI in Action
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-2xl backdrop-blur-sm"
        >
          {/* Mock Dashboard Window Header */}
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-900">
            <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            <div className="mx-auto text-[10px] text-slate-500 font-mono tracking-wider">
              eventintel-dashboard-sandbox-v2
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            {/* Left panels */}
            <div className="md:col-span-3 space-y-4">
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-850/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">
                    Campus Network Sentiment
                  </span>
                  <span className="text-2xl font-bold font-display mt-1 block">
                    87% Engagement
                  </span>
                  <span className="text-xs text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Positive growth index
                  </span>
                </div>
                
                {/* Simulated chart bars */}
                <div className="flex items-end gap-1.5 h-12">
                  <div className="w-2.5 h-1/3 bg-slate-800 rounded-full"></div>
                  <div className="w-2.5 h-1/2 bg-slate-800 rounded-full"></div>
                  <div className="w-2.5 h-3/4 bg-slate-800 rounded-full"></div>
                  <div className="w-2.5 h-5/6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850/60">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Active Catalog
                  </span>
                  <span className="text-xl font-bold font-display mt-0.5 block">
                    124 Active Events
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Across 8 campus blocks</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850/60">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Recommendation Index
                  </span>
                  <span className="text-xl font-bold font-display mt-0.5 block text-purple-400">
                    92% Accuracy
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Personalized matching rate</p>
                </div>
              </div>
            </div>

            {/* Right sidebar AI alerts mock */}
            <div className="p-5 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu size={12} className="animate-spin-slow" /> AI Insight Detected
                </span>
                <p className="text-xs text-purple-200 mt-3 leading-normal font-semibold">
                  "Upcoming Smart Campus Hackathon registrations have accelerated. Predicted seating capacity (150) will overflow in 3 days."
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-500/10 flex items-center justify-between text-[10px] text-purple-400 font-bold">
                <span>View Predictions</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature section */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-900/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-900">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">AI Match Profiling</h3>
            <p className="text-sm text-slate-400 leading-normal">
              Matches events based on academic department, registered skills, past attendances, and feedback sentiments.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-900">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">Predictive Capacity</h3>
            <p className="text-sm text-slate-400 leading-normal">
              Forecasts student registrations and attendance rate ratios. Minimizes food waste and empty seat overheads.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-900">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <BrainCircuit size={20} />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">Feedback Intelligence</h3>
            <p className="text-sm text-slate-400 leading-normal">
              Aggregates organizer surveys, runs natural language sentiment scans, and outlines lists of specific improvements.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
export default LandingPage;
