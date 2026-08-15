import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, ShieldCheck, 
  AlertTriangle, Sparkles, BookOpen, UserCircle2, ArrowRight
} from 'lucide-react';

export const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  // Registration success indicator
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setError('');
      try {
        const ev = await eventService.getEventById(id);
        setEvent(ev);
        
        // Check if user is registered for this event
        const userRegs = await eventService.getRegistrations(user?.id);
        const isReg = userRegs.some(r => r.eventId === id && r.status !== 'cancelled');
        setRegistered(isReg);
      } catch (err) {
        setError(err.message || 'Unable to retrieve event information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [id, user]);

  const handleRegister = async () => {
    if (registered || registering) return;
    
    setRegistering(true);
    try {
      await eventService.registerForEvent(event.id, user?.id);
      setRegistered(true);
      setShowSuccessMsg(true);
      // Increment registration count locally
      setEvent(prev => ({
        ...prev,
        availableSeats: Math.max(0, prev.availableSeats - 1),
        registrationCount: prev.registrationCount + 1
      }));
    } catch (err) {
      alert(err.message || 'Seating allocation failed.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-900 rounded"></div>
        <div className="h-64 w-full bg-slate-900 rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 bg-slate-900 rounded"></div>
            <div className="h-32 bg-slate-900 rounded"></div>
          </div>
          <div className="h-48 bg-slate-900 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle size={40} className="mx-auto text-rose-500" />
        <h2 className="font-display font-bold text-lg text-white">Event not found</h2>
        <p className="text-xs text-slate-400">{error || 'The requested event could not be found.'}</p>
        <button 
          onClick={() => navigate('/student/events')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const isSoldOut = event.availableSeats === 0;

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb back navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Directory</span>
      </button>

      {/* Banner / Hero Image */}
      <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden relative border border-slate-900">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        
        {/* Banner Details Overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[9px] px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white border border-indigo-500/20 font-bold uppercase tracking-wider">
              {event.category}
            </span>
            {event.aiRecommended && (
              <span className="text-[9px] px-2.5 py-0.5 rounded-lg bg-purple-600/90 text-white font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={8} /> {event.aiMatchPercentage}% AI Match
              </span>
            )}
          </div>
          <h1 className="font-display font-extrabold text-xl sm:text-3xl text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Main Grid Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Event Specs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata quick highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-900 text-xs">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Date</span>
                <span className="font-semibold text-white">{event.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Time</span>
                <span className="font-semibold text-white">{event.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-slate-500 shrink-0" />
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Venue</span>
                <span className="font-semibold text-white truncate max-w-[150px] block">{event.venue}</span>
              </div>
            </div>
          </div>

          {/* About / Description */}
          <div className="space-y-2">
            <h2 className="font-display font-bold text-lg text-white">About the Event</h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* AI suggested details mock if recommended */}
          {event.aiRecommended && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-300 space-y-2">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                <Sparkles size={14} className="text-purple-400" />
                <span>AI Matching Rationale</span>
              </div>
              <p className="italic">
                "Our algorithms matching interest clusters for {user?.name.split(' ')[0]} detected a {event.aiMatchPercentage}% match based on your recent engagement with technical events, search histories regarding APIs/React, and CSE club activities."
              </p>
            </div>
          )}

          {/* Agenda */}
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <BookOpen size={16} className="text-slate-500" /> Event Agenda
            </h2>
            <div className="space-y-4 pl-4 border-l border-slate-800">
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-950"></span>
                <span className="text-[10px] text-slate-500 block">Session 1</span>
                <h4 className="text-xs font-semibold text-white mt-0.5">Foundations & Prerequisites Setup</h4>
                <p className="text-[10px] text-slate-400 mt-1">Downloading dependencies, verifying environment configuration, and introductory lecture.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-950"></span>
                <span className="text-[10px] text-slate-500 block">Session 2</span>
                <h4 className="text-xs font-semibold text-white mt-0.5">Hands-on Workshops & Labs</h4>
                <p className="text-[10px] text-slate-400 mt-1">Live pairing coding tasks led by student mentors with structural exercise templates.</p>
              </div>
            </div>
          </div>

          {/* Organizer details */}
          <div className="space-y-3 pt-3">
            <h2 className="font-display font-bold text-lg text-white">Event Organizer</h2>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/20 border border-slate-900">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm">
                <UserCircle2 size={24} className="text-slate-500" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">{event.organizer}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Student Body & Department Organization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Registration Card */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="glass-card p-5 rounded-2xl space-y-4 border border-slate-850">
            <h3 className="text-sm font-bold text-white">Event Registration</h3>
            
            <div className="divide-y divide-slate-900 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Total Seating:</span>
                <span className="font-semibold text-white">{event.totalSeats} seats</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Remaining Seats:</span>
                <span className={`font-semibold ${isSoldOut ? 'text-rose-450' : 'text-emerald-450'}`}>
                  {isSoldOut ? 'Sold Out' : `${event.availableSeats} available`}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Access Type:</span>
                <span className="font-semibold text-indigo-400">Free (Open Entry)</span>
              </div>
            </div>

            {/* Success message on registration */}
            {showSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] text-center font-semibold animate-fade-in flex items-center gap-1.5 justify-center">
                <ShieldCheck size={12} />
                <span>Registered ✓ Details sent to email</span>
              </div>
            )}

            {registered ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>Seating Confirmed</span>
                </button>
                <Link
                  to="/student/registrations"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold text-center block border border-slate-800 transition-all cursor-pointer"
                >
                  Manage My Registrations
                </Link>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={isSoldOut || registering}
                className={`w-full py-3 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer
                  ${isSoldOut 
                    ? 'bg-slate-800 text-slate-500 shadow-none cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 hover:scale-[1.01]'}`}
              >
                {registering ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>{isSoldOut ? 'Sold Out' : 'Register Now'}</span>
                    {!isSoldOut && <ArrowRight size={14} />}
                  </>
                )}
              </button>
            )}

            <p className="text-[10px] text-slate-500 text-center leading-normal">
              By clicking register, your attendance tracking code will be generated and sent directly to your campus wallet.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default EventDetails;
