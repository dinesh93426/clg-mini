import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { 
  Calendar, MapPin, CheckCircle, Clock, XCircle, AlertTriangle, 
  Star, MessageSquareCode, ShieldCheck, X, ThumbsUp, Sparkles, QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Registrations = () => {
  const { user } = useAuth();
  
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | completed | cancelled
  
  // Feedback Modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null); // { sentiment, message }

  // QR Modal states
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
      // Refresh listings
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
      
      // Update registration item state locally to prevent repeat clicks
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

  const getFilteredRegs = () => {
    return registrations.filter(r => r.status === activeTab);
  };

  const filteredRegs = getFilteredRegs();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="h-28 bg-slate-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* QR Pass Modal Overlay */}
      {showQRModal && selectedQRReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl relative text-center">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-1 rounded-full"
            >
              <X size={16} />
            </button>

            <div>
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Event Pass</h4>
              <h3 className="text-lg font-bold text-white leading-tight">{selectedQRReg.event.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedQRReg.event.date} at {selectedQRReg.event.venue}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl mx-auto w-fit shadow-[0_0_30px_rgba(79,70,229,0.15)] border-4 border-indigo-50">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedQRReg.event.id}:${user?.id}`} 
                alt="Event QR Code" 
                className="w-48 h-48"
              />
            </div>

            <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
              Present this QR code to the event organizers at the venue entrance to check-in.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Modal Overlay */}
      {showFeedbackModal && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-650/15 text-indigo-400">
                <MessageSquareCode size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submit Feedback</h4>
                <h3 className="text-sm font-bold text-white truncate max-w-[280px]">{selectedReg.event.title}</h3>
              </div>
            </div>

            {feedbackResult ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-450">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-xs text-emerald-400 font-semibold">{feedbackResult.message}</p>
                
                {/* AI analyzed sentiment display */}
                <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-left space-y-1">
                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">
                    AI Sentiment Analysis
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Based on your comment description, the AI engine classified your feedback sentiment as:
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 mt-1.5 rounded-full
                    ${feedbackResult.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      feedbackResult.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                      'bg-slate-800 text-slate-400 border border-slate-700'}`}
                  >
                    <Sparkles size={10} /> Sentiment: {feedbackResult.sentiment}
                  </span>
                </div>

                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all mt-4"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Overall Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                      >
                        <Star 
                          size={24} 
                          fill={star <= rating ? '#fbbf24' : 'none'} 
                          className={star <= rating ? 'text-amber-400' : 'text-slate-600'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Your Comments</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you liked, or where organization could improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={feedbackSubmitting || !comment.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  {feedbackSubmitting ? 'Analyzing sentiment...' : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">My Registrations</h1>
        <p className="text-slate-400 text-sm mt-1">Review upcoming seats, submit event feedback, or download attendance logs.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-900 text-xs font-bold shrink-0">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed & Past' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition-all cursor-pointer
              ${activeTab === tab.id 
                ? 'border-indigo-500 text-indigo-400 font-semibold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Registrations List Cards */}
      {filteredRegs.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <Calendar size={32} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">No registrations found</h3>
          <p className="text-xs text-slate-450 max-w-sm mx-auto">
            You don't have any events listed in this category. Go to the <Link to="/student/events" className="text-indigo-400 hover:underline">Explore Events</Link> page to register.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegs.map(reg => (
            <div 
              key={reg.id}
              className="glass-card p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between border border-slate-900"
            >
              <div className="flex gap-4 items-center w-full md:w-auto">
                <img src={reg.event.image} alt={reg.event.title} className="w-16 h-16 object-cover rounded-lg bg-slate-900 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/15">
                      {reg.event.category}
                    </span>
                    {reg.attendance && (
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-0.5">
                        <CheckCircle size={8} /> Attended
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 truncate">{reg.event.title}</h3>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={10} />
                      <span>{reg.event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={10} />
                      <span className="truncate max-w-[100px]">{reg.event.venue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                {activeTab === 'upcoming' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenQR(reg)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode size={14} />
                      View Pass
                    </button>
                    <Link
                      to={`/student/events/${reg.event.id}`}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleCancelRegistration(reg.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/20 transition-all cursor-pointer"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                )}

                {activeTab === 'completed' && (
                  <div className="flex items-center gap-2">
                    {reg.feedbackSubmitted ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-500">Feedback Submitted</span>
                        {reg.feedbackSentiment && (
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full border
                            ${reg.feedbackSentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              reg.feedbackSentiment === 'Negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                              'bg-slate-800 text-slate-400 border-slate-700'}`}
                          >
                            <Sparkles size={8} /> Sentiment: {reg.feedbackSentiment}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenFeedback(reg)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Star size={12} fill="currentColor" />
                        <span>Give Feedback</span>
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'cancelled' && (
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1 px-3 py-1.5 bg-slate-900 rounded-lg">
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
