import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { 
  ArrowLeft, UploadCloud, BrainCircuit, Sparkles, Send, 
  CheckCircle, FileImage, ShieldCheck, Mail, Award
} from 'lucide-react';

export const Certificates = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Feature Steps
  // 1: Upload, 2: AI Processing, 3: Preview & Dispatch, 4: Success
  const [step, setStep] = useState(1);
  const [templatePreview, setTemplatePreview] = useState(null);
  
  // Field positions (percentages)
  const [positions, setPositions] = useState({
    name: { x: 50, y: 40 },
    title: { x: 50, y: 65 },
    college: { x: 50, y: 80 }
  });
  const [activeDrag, setActiveDrag] = useState(null);
  const containerRef = useRef(null);

  // Dispatch mock
  const [dispatching, setDispatching] = useState(false);

  const fileInputRef = useRef(null);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTemplatePreview(url);
      setStep(3); // Skip straight to the manual editor
    }
  };

  // Drag logic
  const handleMouseDown = (field) => {
    setActiveDrag(field);
  };

  const handleMouseMove = (e) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPositions(prev => ({
      ...prev,
      [activeDrag]: { 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
      }
    }));
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  const handleDispatch = () => {
    setDispatching(true);
    // Simulate email dispatch delay
    setTimeout(() => {
      setDispatching(false);
      setStep(4);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const eligibleCount = Math.floor((event?.registrationCount || 0) * 0.85); // mock 85% attended

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header back */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Analytics</span>
      </button>

      <div>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
          <Award size={26} className="text-purple-400" />
          Certificate Dispatch Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Automate bulk certificate generation for {event?.title} attendees using visual AI placement.
        </p>
      </div>

      {/* Stepper UI */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-900 relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-900 -z-10 -translate-y-1/2"></div>
        {[
          { num: 1, label: 'Upload Template' },
          { num: 3, label: 'Position Fields' },
          { num: 4, label: 'Completed' }
        ].map((s, index) => {
          const isActive = step === s.num;
          const isPassed = step > s.num;
          const displayNum = index + 1;
          return (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-[#0b0f19] px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${isActive ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border-2 border-purple-500' : 
                  isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 
                  'bg-slate-900 text-slate-500 border border-slate-800'}`}
              >
                {isPassed ? <CheckCircle size={14} /> : displayNum}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-purple-400' : isPassed ? 'text-emerald-500' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="glass-card rounded-2xl p-8 border border-slate-900 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-6">
            <FileImage size={32} className="text-slate-500" />
          </div>
          
          <h2 className="text-lg font-bold text-white mb-2">Upload Blank Certificate Template</h2>
          <p className="text-xs text-slate-400 max-w-sm mb-8">
            Upload your high-resolution JPG or PNG blank certificate template. Ensure the template is empty where student names should appear.
          </p>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-3 rounded-xl bg-purple-650 hover:bg-purple-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <UploadCloud size={16} />
            Browse Files
          </button>
        </div>
      )}

      {/* Step 3: Interactive Editor & Dispatch */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in"
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
        >
          
          {/* Interactive Editor Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-purple-400" /> Interactive Field Editor
              </span>
              <span className="text-[10px] text-slate-400 italic">Drag fields to position</span>
            </div>

            <div 
              ref={containerRef}
              className="relative w-full aspect-[1.414] bg-white rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl select-none"
            >
              <img src={templatePreview} alt="Certificate Template" className="w-full h-full object-cover pointer-events-none" />
              
              {/* Draggable Overlays */}
              
              {/* Name Field */}
              <div 
                onMouseDown={() => handleMouseDown('name')}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-4 text-center cursor-move transition-all duration-75
                  ${activeDrag === 'name' ? 'bg-purple-500/20 border-2 border-purple-400 scale-105' : 'bg-purple-500/10 border border-dashed border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-400'}`}
                style={{ left: `${positions.name.x}%`, top: `${positions.name.y}%`, width: '80%' }}
              >
                <span className="absolute -top-3 -left-1 bg-purple-600 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-lg">
                  Drag: Student Name
                </span>
                <h2 className="text-3xl font-serif text-slate-800 italic">John Doe (Student Demo)</h2>
              </div>
              
              {/* Event Title Field */}
              <div 
                onMouseDown={() => handleMouseDown('title')}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 text-center cursor-move transition-all duration-75
                  ${activeDrag === 'title' ? 'bg-indigo-500/20 border-2 border-indigo-400 scale-105' : 'bg-indigo-500/10 border border-dashed border-indigo-500/50 hover:bg-indigo-500/20 hover:border-indigo-400'}`}
                style={{ left: `${positions.title.x}%`, top: `${positions.title.y}%` }}
              >
                <span className="absolute -top-3 -left-1 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-lg">
                  Drag: Event Title
                </span>
                <p className="text-sm font-semibold text-slate-700 uppercase tracking-widest whitespace-nowrap">{event?.title}</p>
              </div>

              {/* College Name Field */}
              <div 
                onMouseDown={() => handleMouseDown('college')}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 text-center cursor-move transition-all duration-75
                  ${activeDrag === 'college' ? 'bg-emerald-500/20 border-2 border-emerald-400 scale-105' : 'bg-emerald-500/10 border border-dashed border-emerald-500/50 hover:bg-emerald-500/20 hover:border-emerald-400'}`}
                style={{ left: `${positions.college.x}%`, top: `${positions.college.y}%` }}
              >
                <span className="absolute -top-3 -left-1 bg-emerald-600 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-lg">
                  Drag: College Name
                </span>
                <p className="text-sm font-serif text-slate-600 uppercase tracking-widest whitespace-nowrap">EventIntel University</p>
              </div>

            </div>
            <p className="text-[10px] text-slate-500 text-center leading-normal">
              *All {eligibleCount} certificates will be generated using these relative coordinates.
            </p>
          </div>

          {/* Dispatch Console */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-900 space-y-6">
              
              <div>
                <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-900 pb-2">Dispatch Parameters</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Target Event</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{event?.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Registrations</span>
                    <span className="font-semibold text-slate-300">{event?.registrationCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Eligible (Checked-In)</span>
                    <span className="font-bold text-emerald-400">{eligibleCount} Students</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Delivery Method</span>
                    <span className="font-semibold text-indigo-400 flex items-center gap-1">
                      <Mail size={12} /> Direct Email
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200 leading-relaxed">
                <span className="font-bold text-amber-400 block mb-1">Confirm Batch Run</span>
                Please review the placeholder preview carefully. Once dispatched, personalized high-resolution PDFs will be generated and emailed directly to all {eligibleCount} eligible attendees.
              </div>

              <button
                onClick={handleDispatch}
                disabled={dispatching}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                {dispatching ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Dispatching {eligibleCount} emails...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Dispatch Certificates Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="glass-card rounded-2xl p-12 border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in bg-emerald-500/5">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2">
            <ShieldCheck size={40} />
          </div>
          
          <h2 className="text-2xl font-display font-bold text-white">Batch Dispatched Successfully</h2>
          <p className="text-xs text-emerald-200/70 max-w-md leading-relaxed pb-6">
            The AI engine successfully generated and mailed {eligibleCount} certificates to verified attendees of "{event?.title}". 
          </p>

          <button 
            onClick={() => navigate(`/organizer/events/${id}/analytics`)}
            className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Return to Analytics
          </button>
        </div>
      )}

    </div>
  );
};

export default Certificates;
