import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { ArrowLeft, QrCode, ScanLine, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

export const Scanner = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const ev = await eventService.getEventById(id);
        setEvent(ev);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleSimulateScan = (e) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;
    
    // Simulate API call and success
    setScanResult(null);
    setTimeout(() => {
      setScanResult({
        success: true,
        studentName: studentIdInput.startsWith('stu-') ? `Demo Student (${studentIdInput})` : studentIdInput,
        timestamp: new Date().toLocaleTimeString()
      });
      setStudentIdInput('');
      
      // Auto-clear result after 3 seconds to be ready for next scan
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    }, 600);
  };

  const handleMockRandomScan = () => {
    setScanResult(null);
    setTimeout(() => {
      setScanResult({
        success: true,
        studentName: 'Alex Johnson (CSE 3rd Year)',
        timestamp: new Date().toLocaleTimeString()
      });
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      
      {/* Header back */}
      <div className="shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft size={14} />
          <span>Back to Analytics</span>
        </button>

        <div>
          <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
            <QrCode size={26} className="text-indigo-400" />
            Check-in Scanner
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Scan attendee QR passes for <strong>{event?.title}</strong> to mark attendance.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        
        {/* Left Column: Scanner View */}
        <div className="glass-card rounded-3xl border-2 border-slate-800 overflow-hidden relative flex flex-col items-center justify-center bg-[#0b0f19]">
          
          {/* Simulated Camera feed overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {!scanResult ? (
            <div className="relative z-10 flex flex-col items-center">
              {/* Scanner targeting reticle */}
              <div className="w-64 h-64 border-2 border-dashed border-indigo-500/50 rounded-3xl relative flex items-center justify-center overflow-hidden">
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                <ScanLine size={48} className="text-indigo-500/30" />
                
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
              </div>
              <p className="mt-6 text-sm font-semibold text-slate-300 animate-pulse">Waiting for QR Code...</p>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center text-center animate-fade-in bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border-4 border-emerald-500/40">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white font-display mb-1">Checked In!</h3>
              <p className="text-emerald-400 font-semibold">{scanResult.studentName}</p>
              <span className="text-[10px] text-slate-500 mt-4 block">Scanned at {scanResult.timestamp}</span>
            </div>
          )}

          {/* Warning banner */}
          <div className="absolute bottom-0 left-0 right-0 bg-amber-500/10 border-t border-amber-500/20 p-3 flex items-center justify-center gap-2 text-[10px] text-amber-400 font-bold uppercase tracking-widest backdrop-blur-md">
            <AlertTriangle size={12} />
            <span>Simulated Scanner Mode Active</span>
          </div>
        </div>

        {/* Right Column: Manual Simulator Controls */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-900 h-full flex flex-col">
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <UserCheck size={16} className="text-indigo-400" />
                Manual Entry & Simulation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Because camera permissions are disabled in demo mode, use these tools to simulate scanning an attendee's QR pass.
              </p>
            </div>

            <form onSubmit={handleSimulateScan} className="space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Simulate QR Payload (Student ID)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. stu-10452"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer"
                  >
                    Check In
                  </button>
                </div>
              </div>
            </form>

            <div className="pt-6 border-t border-slate-900 mt-6">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                Or trigger a random mock scan
              </span>
              <button
                onClick={handleMockRandomScan}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ScanLine size={14} />
                Simulate Next Student QR
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
export default Scanner;
