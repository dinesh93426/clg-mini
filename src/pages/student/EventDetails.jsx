import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, ShieldCheck, 
  AlertTriangle, Sparkles, BookOpen, UserCircle2, ArrowRight,
  Star, MessageSquare
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
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  // Feedback State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setError('');
      try {
        const ev = await eventService.getEventById(id);
        setEvent(ev);
        
        const userRegs = await eventService.getRegistrations(user?.id);
        const userReg = userRegs.find(r => r.eventId === id && r.status !== 'cancelled');
        if (userReg) {
          setRegistered(true);
          setRegistrationData(userReg);
        } else {
          setRegistered(false);
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve event information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [id, user]);

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      alert("Please select a star rating first.");
      return;
    }
    
    if (!registrationData) return;

    setFeedbackSubmitting(true);
    try {
      await eventService.submitFeedback(registrationData.id, {
        rating,
        comment
      });
      setFeedbackResult('success');
      // Update registrationData to reflect submission so the form hides
      setRegistrationData(prev => ({ ...prev, feedbackSubmitted: true, feedbackRating: rating, feedbackText: comment }));
    } catch (err) {
      console.error(err);
      setFeedbackResult('error');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (registered || registering) return;
    
    setRegistering(true);
    try {
      await eventService.registerForEvent(event.id, user?.id);
      setRegistered(true);
      setShowSuccessMsg(true);
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
        <div className="h-6 w-32 bg-[#E2E8F0] rounded"></div>
        <div className="h-64 w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-28 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>
          </div>
          <div className="h-48 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center space-y-3 max-w-md mx-auto bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
        <AlertTriangle size={32} className="mx-auto text-[#D97706]" />
        <h2 className="text-base font-bold text-[#172033]">Event not found</h2>
        <p className="text-xs text-[#64748B]">{error || 'The requested event could not be found.'}</p>
        <button 
          onClick={() => navigate('/student/events')}
          className="px-3.5 py-1.5 bg-[#FF5A1F] hover:bg-[#E94712] rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const isSoldOut = event.availableSeats === 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Breadcrumb back navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Events</span>
      </button>

      {/* Banner Hero Image */}
      <div className="h-60 md:h-72 w-full rounded-2xl overflow-hidden relative border border-[#E2E8F0] shadow-xs bg-[#F8FAFC]">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Banner Details Overlay */}
        <div className="absolute bottom-5 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFFFFF]/90 text-[#172033] font-semibold uppercase tracking-wider shadow-xs">
              {event.category}
            </span>
            {event.aiRecommended && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF5A1F] text-white font-semibold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles size={10} /> {event.aiMatchPercentage}% AI Match
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Main Grid Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Event Specs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata quick highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF1EB] text-[#FF5A1F] flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <span className="block text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider">Date</span>
                <span className="font-semibold text-[#172033] text-xs">{event.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF1EB] text-[#FF5A1F] flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <span className="block text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider">Time</span>
                <span className="font-semibold text-[#172033] text-xs">{event.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <span className="block text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider">Venue</span>
                <span className="font-semibold text-[#172033] text-xs truncate max-w-[140px] block">{event.venue}</span>
              </div>
            </div>
          </div>

          {/* About / Description */}
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-2">
            <h2 className="text-sm font-bold text-[#172033]">About the Event</h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* AI matching rationale */}
          {event.aiRecommended && (
            <div className="p-4 rounded-xl bg-[#F8FAFC] border-l-2 border-[#FF5A1F] text-xs text-[#64748B] space-y-1">
              <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-[10px] text-[#FF5A1F]">
                <Sparkles size={12} />
                <span>AI Matching Rationale</span>
              </div>
              <p className="italic leading-relaxed">
                "Our algorithms detected a {event.aiMatchPercentage}% match based on your recent activity profile, participation in technical events, and preferred campus workshops."
              </p>
            </div>
          )}

          {/* Agenda */}
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-1.5">
              <BookOpen size={16} className="text-[#FF5A1F]" /> Event Agenda
            </h2>
            <div className="space-y-3.5 pl-3.5 border-l-2 border-[#E2E8F0] ml-1.5">
              <div className="relative">
                <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-[#FF5A1F] border-2 border-white"></span>
                <span className="text-[10px] font-bold text-[#94A3B8] block uppercase">Session 1 • 45 mins</span>
                <h4 className="text-xs font-bold text-[#172033] mt-0.5">Foundations & Prerequisites Setup</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Verifying environment configuration and introductory briefing.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-[#CBD5E1] border-2 border-white"></span>
                <span className="text-[10px] font-bold text-[#94A3B8] block uppercase">Session 2 • 90 mins</span>
                <h4 className="text-xs font-bold text-[#172033] mt-0.5">Hands-on Workshops & Labs</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Interactive coding challenges mentored by student committee leads.</p>
              </div>
            </div>
          </div>

          {/* Organizer details */}
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#172033]">Event Organizer</h2>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#FFF1EB] flex items-center justify-center text-[#FF5A1F]">
                <UserCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">{event.organizer}</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Campus Student Committee & Department Organization</p>
              </div>
            </div>
          </div>

          {/* Feedback Form (Shown if Event is Past, User is Registered, and hasn't submitted yet) */}
          {registered && registrationData && new Date(event.date) < new Date() && !registrationData.feedbackSubmitted && (
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#172033] flex items-center gap-1.5">
                <MessageSquare size={16} className="text-[#FF5A1F]" /> Rate & Review this Event
              </h2>
              <p className="text-xs text-[#64748B]">Your feedback helps organizers improve future events.</p>
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#172033] mb-2">Overall Experience Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-full hover:bg-[#FFF1EB] transition-colors focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={`transition-colors ${(hoverRating || rating) >= star ? 'fill-[#FF5A1F] text-[#FF5A1F]' : 'text-[#CBD5E1]'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="comment" className="block text-xs font-medium text-[#172033] mb-2">What did you like or dislike? (Optional)</label>
                  <textarea
                    id="comment"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] resize-none transition-all placeholder:text-[#94A3B8]"
                    placeholder="E.g., Great speaker, but the room was too cold..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  {feedbackResult === 'success' ? (
                    <span className="text-[#16A34A] text-xs font-semibold flex items-center gap-1"><ShieldCheck size={14}/> Feedback submitted successfully</span>
                  ) : feedbackResult === 'error' ? (
                    <span className="text-[#DC2626] text-xs font-medium">Failed to submit feedback. Try again.</span>
                  ) : (
                    <span></span>
                  )}
                  
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSubmitting || rating === 0}
                    className="px-5 py-2 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {feedbackSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {registered && registrationData?.feedbackSubmitted && (
             <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-2">
                <div className="flex justify-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={(registrationData.feedbackRating || 5) >= star ? 'fill-[#FF5A1F] text-[#FF5A1F]' : 'text-[#CBD5E1]'}
                    />
                  ))}
                </div>
                <h3 className="text-xs font-bold text-[#172033]">You've reviewed this event.</h3>
                <p className="text-[11px] text-[#64748B]">Thank you for contributing to campus event intelligence!</p>
             </div>
          )}

        </div>

        {/* Right Column: Sticky Registration Card */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl space-y-4 border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#172033]">Registration Details</h3>
            
            <div className="divide-y divide-[#E2E8F0] text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-[#64748B]">Capacity:</span>
                <span className="font-semibold text-[#172033]">{event.totalSeats} seats</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-[#64748B]">Remaining:</span>
                <span className={`font-semibold ${isSoldOut ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {isSoldOut ? 'Sold Out' : `${event.availableSeats} available`}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-[#64748B]">Access:</span>
                <span className="font-semibold text-[#FF5A1F]">Free (Open Campus Entry)</span>
              </div>
            </div>

            {/* Success message on registration */}
            {showSuccessMsg && (
              <div className="p-2.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-lg text-xs text-center font-medium flex items-center gap-1.5 justify-center">
                <ShieldCheck size={14} />
                <span>Seat confirmed successfully</span>
              </div>
            )}

            {registered ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-2.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>Seating Confirmed</span>
                </button>
                <Link
                  to="/student/registrations"
                  className="w-full py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172033] text-xs font-medium text-center block border border-[#E2E8F0] transition-colors"
                >
                  View My Event Pass
                </Link>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={isSoldOut || registering}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer
                  ${isSoldOut 
                    ? 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed' 
                    : 'bg-[#FF5A1F] hover:bg-[#E94712]'}`}
              >
                {registering ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>{isSoldOut ? 'Sold Out' : 'Register Now'}</span>
                    {!isSoldOut && <ArrowRight size={13} />}
                  </>
                )}
              </button>
            )}

            <p className="text-[10px] text-[#94A3B8] text-center leading-normal">
              An attendance barcode will be associated with your student ID upon registration.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default EventDetails;
