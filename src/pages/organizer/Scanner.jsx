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
  const [errorMsg, setErrorMsg] = useState(null);
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

  const handleSimulateScan = async (e) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;
    
    setScanResult(null);
    setErrorMsg(null);
    
    try {
      const result = await eventService.markAttendance(id, studentIdInput);
      setScanResult(result);
      setStudentIdInput('');
      
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Scan failed');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleMockRandomScan = async () => {
    setScanResult(null);
    setErrorMsg(null);
    try {
      // Simulate scanning the QR payload
      const payload = `${id}:demo-stu-${Math.floor(Math.random() * 1000)}`;
      const result = await eventService.markAttendance(id, payload);
      setScanResult(result);
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Scan failed. Student may not be registered.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF5A1F] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header back */}
      <div className="shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer mb-4"
        >
          <ArrowLeft size={14} />
          <span>Back to Analytics</span>
        </button>

        <div className="border-b border-[#E2E8F0] pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
            <QrCode size={22} className="text-[#FF5A1F]" />
            Check-in Scanner
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Scan attendee QR passes for <strong>{event?.title}</strong> to verify attendance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        
        {/* Left Column: Scanner View */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] overflow-hidden relative flex flex-col items-center justify-center p-8 min-h-[320px] shadow-xs">
          {!scanResult && !errorMsg ? (
            <div className="flex flex-col items-center">
              <div className="w-52 h-52 border-2 border-dashed border-[#FF5A1F]/40 rounded-2xl relative flex items-center justify-center bg-[#F8FAFC]">
                <ScanLine size={40} className="text-[#FF5A1F]/30" />
                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[#FF5A1F] rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[#FF5A1F] rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[#FF5A1F] rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[#FF5A1F] rounded-br-lg"></div>
              </div>
              <p className="mt-4 text-xs font-semibold text-[#64748B]">Waiting for QR Code scan...</p>
            </div>
          ) : scanResult ? (
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0]">
              <div className="w-14 h-14 rounded-full bg-[#16A34A] text-white flex items-center justify-center mb-2">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#16A34A]">Checked In Successfully</h3>
              <p className="text-xs text-[#172033] font-semibold mt-0.5">{scanResult.studentName}</p>
              <p className="text-[10px] text-[#16A34A] font-medium mt-1">{scanResult.message}</p>
              <span className="text-[10px] text-[#64748B] mt-2 block">Scanned at {scanResult.timestamp}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-[#FEE2E2] border border-[#FECACA]">
              <div className="w-14 h-14 rounded-full bg-[#DC2626] text-white flex items-center justify-center mb-2">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#DC2626]">Check-In Failed</h3>
              <p className="text-xs text-[#172033] font-semibold mt-0.5">{errorMsg}</p>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-[#FEF3C7] border-t border-[#FDE68A] p-2 flex items-center justify-center gap-1.5 text-[10px] text-[#D97706] font-bold uppercase tracking-wider">
            <AlertTriangle size={11} />
            <span>Simulated Scanner Mode Active</span>
          </div>
        </div>

        {/* Right Column: Manual Simulator Controls */}
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between h-full space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033] mb-1 flex items-center gap-1.5">
                <UserCheck size={16} className="text-[#FF5A1F]" />
                Manual Entry & Simulation
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Use the tools below to simulate scanning an attendee's digital QR pass.
              </p>
            </div>

            <form onSubmit={handleSimulateScan} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Student ID Payload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. stu-10452"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF5A1F] hover:bg-[#E94712] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    Check In
                  </button>
                </div>
              </div>
            </form>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={handleMockRandomScan}
                className="w-full py-2.5 bg-[#F8FAFC] hover:bg-[#FFF1EB] border border-[#E2E8F0] text-[#FF5A1F] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ScanLine size={13} />
                <span>Simulate Next Student QR</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
export default Scanner;
