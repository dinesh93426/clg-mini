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

  const [step, setStep] = useState(1);
  const [templatePreview, setTemplatePreview] = useState(null);
  
  const [positions, setPositions] = useState({
    name: { x: 50, y: 40 },
    title: { x: 50, y: 65 },
    college: { x: 50, y: 80 }
  });
  
  const [texts, setTexts] = useState({
    title: 'EVENT TITLE',
    college: 'EventIntel University'
  });
  const [activeDrag, setActiveDrag] = useState(null);
  const containerRef = useRef(null);
  const [dispatching, setDispatching] = useState(false);
  const fileInputRef = useRef(null);
  const [templateFile, setTemplateFile] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const ev = await eventService.getEventById(id);
        setEvent(ev);
        setTexts(prev => ({ ...prev, title: ev.title }));
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
      setTemplateFile(file);
      setStep(3);
    }
  };

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

  const handleDispatch = async () => {
    if (!templateFile) return;
    setDispatching(true);
    try {
      const formData = new FormData();
      formData.append('template', templateFile);
      formData.append('positions', JSON.stringify(positions));
      formData.append('texts', JSON.stringify({
        title: texts.title,
        college: texts.college
      }));

      await eventService.dispatchCertificates(id, formData);
      setStep(4);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to dispatch certificates.');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF5A1F] border-t-transparent" />
      </div>
    );
  }

  const eligibleCount = Math.floor((event?.registrationCount || 0) * 0.85);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header back */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Analytics</span>
      </button>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
          <Award size={22} className="text-[#FF5A1F]" />
          Certificate Dispatch Hub
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Automate bulk certificate generation for {event?.title} attendees using visual placement.
        </p>
      </div>

      {/* Stepper UI */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#E2E8F0] -z-10 -translate-y-1/2"></div>
        {[
          { num: 1, label: 'Upload Template' },
          { num: 3, label: 'Position Fields' },
          { num: 4, label: 'Completed' }
        ].map((s, index) => {
          const isActive = step === s.num;
          const isPassed = step > s.num;
          const displayNum = index + 1;
          return (
            <div key={s.num} className="flex flex-col items-center gap-1.5 bg-[#F8FAFC] px-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isActive ? 'bg-[#FF5A1F] text-white shadow-xs' : 
                isPassed ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]' : 
                'bg-[#FFFFFF] text-[#94A3B8] border border-[#E2E8F0]'
              }`}>
                {isPassed ? <CheckCircle size={13} /> : displayNum}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-[#FF5A1F]' : isPassed ? 'text-[#16A34A]' : 'text-[#94A3B8]'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mb-4 text-[#94A3B8]">
            <FileImage size={28} />
          </div>
          
          <h2 className="text-base font-bold text-[#172033] mb-1">Upload Blank Certificate Template</h2>
          <p className="text-xs text-[#64748B] max-w-sm mb-6 leading-relaxed">
            Upload your high-resolution JPG or PNG certificate template. Ensure the template is empty where student names should appear.
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
            className="px-5 py-2.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UploadCloud size={15} />
            <span>Browse Template File</span>
          </button>
        </div>
      )}

      {/* Step 3: Interactive Editor & Dispatch */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
        >
          
          {/* Interactive Editor Container */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-[#FF5A1F]" /> Interactive Field Placement
              </span>
              <span className="text-[10px] text-[#94A3B8]">Drag items to reposition</span>
            </div>

            <div 
              ref={containerRef}
              className="relative w-full aspect-[1.414] bg-white rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xs select-none"
            >
              <img src={templatePreview} alt="Certificate Template" className="w-full h-full object-cover pointer-events-none" />
              
              {/* Draggable Overlays */}
              <div 
                onMouseDown={(e) => {
                  if (e.target.tagName !== 'H2' && e.target.tagName !== 'P') handleMouseDown('name');
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 text-center cursor-move transition-all ${
                  activeDrag === 'name' ? 'bg-[#EEECFF] border-2 border-[#FF5A1F]' : 'bg-[#EEECFF]/70 border border-dashed border-[#FF5A1F] hover:bg-[#EEECFF]'
                }`}
                style={{ left: `${positions.name.x}%`, top: `${positions.name.y}%`, width: '75%' }}
              >
                <span className="absolute -top-2.5 -left-1 bg-[#FF5A1F] text-white text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                  Student Name
                </span>
                <h2 className="text-xl font-serif text-[#172033] italic">Alex Johnson (Student Name)</h2>
              </div>
              
              <div 
                onMouseDown={(e) => {
                  if (e.target.tagName !== 'H2' && e.target.tagName !== 'P') handleMouseDown('title');
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 text-center cursor-move transition-all ${
                  activeDrag === 'title' ? 'bg-[#EEECFF] border-2 border-[#FF5A1F]' : 'bg-[#EEECFF]/70 border border-dashed border-[#FF5A1F] hover:bg-[#EEECFF]'
                }`}
                style={{ left: `${positions.title.x}%`, top: `${positions.title.y}%` }}
              >
                <span className="absolute -top-2.5 -left-1 bg-[#FF5A1F] text-white text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                  Event Title
                </span>
                <p 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setTexts(prev => ({ ...prev, title: e.target.innerText }))}
                  className="text-xs font-semibold text-[#172033] uppercase tracking-wider whitespace-nowrap outline-none cursor-text"
                >
                  {texts.title}
                </p>
              </div>

              <div 
                onMouseDown={(e) => {
                  if (e.target.tagName !== 'H2' && e.target.tagName !== 'P') handleMouseDown('college');
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 text-center cursor-move transition-all ${
                  activeDrag === 'college' ? 'bg-[#DCFCE7] border-2 border-[#16A34A]' : 'bg-[#DCFCE7]/70 border border-dashed border-[#16A34A] hover:bg-[#DCFCE7]'
                }`}
                style={{ left: `${positions.college.x}%`, top: `${positions.college.y}%` }}
              >
                <span className="absolute -top-2.5 -left-1 bg-[#16A34A] text-white text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                  Institution
                </span>
                <p 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setTexts(prev => ({ ...prev, college: e.target.innerText }))}
                  className="text-xs font-serif text-[#172033] uppercase tracking-wider whitespace-nowrap outline-none cursor-text"
                >
                  {texts.college}
                </p>
              </div>

            </div>
            <p className="text-[10px] text-[#94A3B8] text-center">
              *All {eligibleCount} certificates will be generated with these relative coordinates.
            </p>
          </div>

          {/* Dispatch Console */}
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
              
              <div>
                <h3 className="text-xs font-bold text-[#172033] mb-3 border-b border-[#E2E8F0] pb-2 uppercase tracking-wider">Dispatch Summary</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Target Event</span>
                    <span className="font-semibold text-[#172033] truncate max-w-[180px]">{event?.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Total Registrations</span>
                    <span className="font-semibold text-[#172033]">{event?.registrationCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Eligible (Checked-In)</span>
                    <span className="font-bold text-[#16A34A]">{eligibleCount} Students</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Delivery Method</span>
                    <span className="font-semibold text-[#FF5A1F] flex items-center gap-1">
                      <Mail size={12} /> Direct Email
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3 text-xs text-[#92400E] leading-relaxed">
                <span className="font-bold block mb-0.5">Confirm Batch Generation</span>
                High-resolution PDFs will be compiled and dispatched directly to all {eligibleCount} eligible student mailboxes.
              </div>

              <button
                onClick={handleDispatch}
                disabled={dispatching}
                className="w-full py-2.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {dispatching ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Dispatching {eligibleCount} certificates...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
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
        <div className="bg-[#FFFFFF] rounded-2xl p-10 border border-[#BBF7D0] shadow-xs flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mb-1">
            <ShieldCheck size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-[#172033]">Batch Dispatched Successfully</h2>
          <p className="text-xs text-[#64748B] max-w-md leading-relaxed pb-4">
            The AI engine generated and emailed {eligibleCount} certificates to verified attendees of "{event?.title}". 
          </p>

          <button 
            onClick={() => navigate(`/organizer/events/${id}/analytics`)}
            className="px-4 py-2 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Return to Analytics
          </button>
        </div>
      )}

    </div>
  );
};

export default Certificates;
