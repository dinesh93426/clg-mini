import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { 
  Calendar, MapPin, CheckCircle, Clock, XCircle, AlertTriangle, 
  Star, MessageSquareCode, ShieldCheck, X, Sparkles, QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Registrations = () => {
  const { user } = useAuth();
  
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | completed | cancelled
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRReg, setSelectedQRReg] = useState(null);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const data = await eventService.getRegistrations(user?.id);
      setRegistrations(data);
    } catch (err) {
      console.error("Error loading registrations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [user]);

  const handleCancelRegistration = async (regId) => {
    if (!window.confirm("Are you sure you want to cancel your seat for this event?")) return;
    
    try {
      await eventService.cancelRegistration(regId);
      loadRegistrations();
    } catch (err) {
      alert(err.message || 'Cancellation failed.');
    }
  };

  const handleOpenFeedback = (reg) => {
    setSelectedReg(reg);
    setRating(5);
    setComment('');
    setFeedbackResult(null);
    setShowFeedbackModal(true);
  };

  const handleOpenQR = (reg) => {
    setSelectedQRReg(reg);
    setShowQRModal(true);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setFeedbackSubmitting(true);
    try {
      const res = await eventService.submitFeedback(selectedReg.id, rating, comment);
      setFeedbackResult(res);
      
      setRegistrations(prev => prev.map(r => {
        if (r.id === selectedReg.id) {
          return {
            ...r,
            feedbackSubmitted: true,
            feedbackRating: rating,
            feedbackText: comment,
            feedbackSentiment: res.sentiment
          };
        }
        return r;
      }));
    } catch (err) {
      alert('Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const filteredRegs = registrations.filter(r => r.status === activeTab);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-[#E2E8F0] rounded-lg"></div>
        <div className="space-y-3">
          {[1, 2].map(n => (
            <div key={n} className="h-24 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* QR Pass Modal Overlay */}
      {showQRModal && selectedQRReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/30 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-xl relative text-center">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
            >
              <X size={15} />
            </button>

            <div>
              <span className="text-[10px] font-bold text-[#FF5A1F] uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#FFF1EB] border border-[#FFD2C2] inline-block mb-1.5">Digital Event Pass</span>
              <h3 className="text-sm font-bold text-[#172033] leading-snug">{selectedQRReg.event?.title}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">{selectedQRReg.event?.date} • {selectedQRReg.event?.venue}</p>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl mx-auto w-fit border border-[#E2E8F0]">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedQRReg.event?.id || 'event'}:${user?.id}`} 
                alt="Event QR Code" 
                className="w-40 h-40 rounded"
              />
            </div>

            <p className="text-[11px] text-[#64748B] max-w-[220px] mx-auto leading-relaxed">
              Present this QR code to the event organizers at the venue entrance for automated attendance.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Modal Overlay */}
      {showFeedbackModal && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/30 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl relative">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF1EB] text-[#FF5A1F] flex items-center justify-center shrink-0">
                <MessageSquareCode size={16} />
              </div>
              <div className="min-w-0 pr-4">
                <span className="text-[10px] font-bold text-[#FF5A1F] uppercase tracking-wider block">Submit Feedback</span>
                <h3 className="text-xs font-bold text-[#172033] truncate">{selectedReg.event?.title}</h3>
              </div>
            </div>

            {feedbackResult ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-xs text-[#16A34A] font-semibold">{feedbackResult.message}</p>
                
                {/* AI analyzed sentiment display */}
                <div className="p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-left space-y-1">
                  <span className="text-[10px] text-[#FF5A1F] font-bold uppercase tracking-wider block">
                    AI Sentiment Analysis
                  </span>
                  <p className="text-[11px] text-[#64748B]">
                    Feedback sentiment processed by fine-tuned Transformer model:
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border
                    ${feedbackResult.sentiment === 'Positive' ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]' : 
                      feedbackResult.sentiment === 'Negative' ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' : 
                      'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'}`}
                  >
                    <Sparkles size={11} /> Sentiment: {feedbackResult.sentiment}
                  </span>
                </div>

                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-full py-2 bg-[#FF5A1F] hover:bg-[#E94712] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-[#94A3B8] hover:text-[#D97706] transition-colors p-0.5 cursor-pointer"
                      >
                        <Star 
                          size={20} 
                          fill={star <= rating ? '#D97706' : 'none'} 
                          className={star <= rating ? 'text-[#D97706]' : 'text-[#CBD5E1]'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Your Comments</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us about your event experience and key takeaways..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="block w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={feedbackSubmitting || !comment.trim()}
                  className="w-full py-2 bg-[#FF5A1F] hover:bg-[#E94712] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {feedbackSubmitting ? 'Analyzing sentiment...' : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">My Registrations</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Manage event reservations, digital event passes, and feedback submissions.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[#E2E8F0] text-xs font-semibold">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition-colors cursor-pointer -mb-px
              ${activeTab === tab.id 
                ? 'border-[#FF5A1F] text-[#FF5A1F]' 
                : 'border-transparent text-[#64748B] hover:text-[#172033]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Registrations List Cards */}
      {filteredRegs.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <Calendar size={22} className="text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-semibold text-[#172033]">No registrations found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You don't have any events in this section. Explore upcoming workshops in the catalog.
          </p>
          <Link
            to="/student/events"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRegs.map(reg => (
            <div 
              key={reg.id}
              className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs hover:border-[#CBD5E1] transition-all"
            >
              <div className="flex gap-3.5 items-center w-full md:w-auto">
                <img src={reg.event?.image} alt={reg.event?.title} className="w-16 h-16 object-cover rounded-lg bg-[#F8FAFC] shrink-0 border border-[#E2E8F0]" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFF1EB] text-[#FF5A1F]">
                      {reg.event?.category}
                    </span>
                    {reg.attendance && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] flex items-center gap-1">
                        <CheckCircle size={10} /> Attended
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] mt-1 truncate">{reg.event?.title}</h3>
                  
                  <div className="flex items-center gap-4 text-[11px] text-[#64748B] mt-1.5">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-[#94A3B8]" />
                      <span>{reg.event?.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#94A3B8]" />
                      <span className="truncate max-w-[150px]">{reg.event?.venue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {activeTab === 'upcoming' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenQR(reg)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#E94712] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode size={13} />
                      <span>View Pass</span>
                    </button>
                    <Link
                      to={`/student/events/${reg.event?.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#172033] bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleCancelRegistration(reg.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {activeTab === 'completed' && (
                  <div className="flex items-center gap-2">
                    {reg.feedbackSubmitted ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-medium text-[#94A3B8]">Feedback Recorded</span>
                        {reg.feedbackSentiment && (
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border
                            ${reg.feedbackSentiment === 'Positive' ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]' : 
                              reg.feedbackSentiment === 'Negative' ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' : 
                              'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'}`}
                          >
                            <Sparkles size={9} /> Sentiment: {reg.feedbackSentiment}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenFeedback(reg)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#E94712] transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Star size={12} fill="currentColor" />
                        <span>Give Feedback</span>
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'cancelled' && (
                  <span className="text-[#94A3B8] text-xs font-medium flex items-center gap-1 px-2.5 py-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <XCircle size={12} />
                    <span>Cancelled</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
export default Registrations;
