import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { EventCard } from '../../components/events/EventCard';
import { Search, SlidersHorizontal, LayoutGrid, List, AlertCircle, X, Sparkles, CheckCircle2, MapPin, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Events = () => {
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [registeringId, setRegisteringId] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  const categories = ['All', 'AI', 'Technology', 'Business', 'Arts', 'Sports'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [allEvents, userRegs] = await Promise.all([
        eventService.getEvents(),
        eventService.getRegistrations(user?.id)
      ]);
      setEvents(allEvents);
      setRegistrations(userRegs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    try {
      await eventService.registerForEvent(eventId, user?.id);
      setAlertInfo({
        type: 'success',
        title: 'Registration Confirmed',
        text: `You have successfully reserved a seat for this event.`
      });
      const updatedRegs = await eventService.getRegistrations(user?.id);
      setRegistrations(updatedRegs);
      
      setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            availableSeats: Math.max(0, e.availableSeats - 1),
            registrationCount: e.registrationCount + 1
          };
        }
        return e;
      }));
    } catch (err) {
      setAlertInfo({
        type: 'error',
        title: 'Registration Failed',
        text: err.message || 'An error occurred during reservation.'
      });
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.description.toLowerCase().includes(search.toLowerCase()) ||
                          e.organizer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-10">
      
      {/* Alert Overlay Modal */}
      {alertInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/30 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl w-full max-w-sm text-center space-y-4 shadow-xl relative">
            <button 
              onClick={() => setAlertInfo(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
            >
              <X size={15} />
            </button>
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
              {alertInfo.type === 'success' ? (
                <CheckCircle2 size={22} className="text-[#16A34A]" />
              ) : (
                <AlertCircle size={22} className="text-[#DC2626]" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#172033]">{alertInfo.title}</h4>
              <p className="text-xs text-[#64748B] leading-relaxed mt-1">{alertInfo.text}</p>
            </div>
            <button
              onClick={() => setAlertInfo(null)}
              className="w-full py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Discover Events</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Explore university workshops, technical hackathons, and guest lectures.</p>
      </div>

      {/* Search and Filters Tool Panel */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search events by title, description, or organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Grid/List View switcher */}
          <div className="flex bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#64748B] hover:text-[#172033]'}`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#64748B] hover:text-[#172033]'}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold text-[#172033] transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={13} className="text-[#64748B]" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex overflow-x-auto gap-1.5 pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer
              ${selectedCategory === cat 
                ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5] font-semibold' 
                : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expanded filters drawer */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs shadow-xs">
          <div>
            <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Department</label>
            <select className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1.5 w-full text-[#172033] focus:outline-none focus:border-[#4F46E5]">
              <option>All Departments</option>
              <option>Computer Science</option>
              <option>Electronics</option>
              <option>Mechanical</option>
            </select>
          </div>
          <div>
            <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Seat Availability</label>
            <select className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1.5 w-full text-[#172033] focus:outline-none focus:border-[#4F46E5]">
              <option>All Events</option>
              <option>Seats Available</option>
              <option>Sold Out</option>
            </select>
          </div>
          <div>
            <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Schedule</label>
            <select className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1.5 w-full text-[#172033] focus:outline-none focus:border-[#4F46E5]">
              <option>Anytime</option>
              <option>This Week</option>
              <option>Next Week</option>
              <option>Next Month</option>
            </select>
          </div>
          <div>
            <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Event Type</label>
            <select className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1.5 w-full text-[#172033] focus:outline-none focus:border-[#4F46E5]">
              <option>All Formats</option>
              <option>Workshop / Lab</option>
              <option>Hackathon</option>
              <option>Seminar</option>
            </select>
          </div>
        </div>
      )}

      {/* Event Grid/List Body */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-72 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 shadow-xs animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center space-y-2.5 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <AlertCircle size={22} className="text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-semibold text-[#172033]">No events found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">Try adjusting your search terms or clearing selected category filters.</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); }}
            className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredEvents.map(event => {
            const isReg = registrations.some(r => r.eventId === event.id && r.status !== 'cancelled');
            return (
              <EventCard
                key={event.id}
                event={event}
                onRegister={handleRegister}
                registered={isReg}
                registering={registeringId === event.id}
              />
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredEvents.map(event => {
            const isReg = registrations.some(r => r.eventId === event.id && r.status !== 'cancelled');
            const isSoldOut = event.availableSeats === 0;
            return (
              <div 
                key={event.id}
                className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex gap-3.5 items-center w-full md:w-auto">
                  <img src={event.image} alt={event.title} className="w-16 h-16 object-cover rounded-lg bg-[#F8FAFC] shrink-0 border border-[#E2E8F0]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5]">
                        {event.category}
                      </span>
                      {event.aiRecommended && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] flex items-center gap-1">
                          <Sparkles size={10} /> {event.aiMatchPercentage}% Match
                        </span>
                      )}
                    </div>
                    <Link to={`/student/events/${event.id}`}>
                      <h3 className="text-xs font-semibold text-[#172033] hover:text-[#4F46E5] transition-colors mt-1 truncate">{event.title}</h3>
                    </Link>
                    <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{event.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end text-xs">
                  <div className="text-left text-[11px] text-[#64748B]">
                    <span className="block font-medium text-[#172033]">{event.date}</span>
                    <span className="block text-[#94A3B8] truncate max-w-[120px]">{event.venue}</span>
                  </div>

                  <div className="text-center text-[11px] text-[#64748B] shrink-0">
                    <span className={`block font-bold text-xs ${isSoldOut ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                      {isSoldOut ? 'Sold Out' : `${event.availableSeats} Left`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/student/events/${event.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172033] text-xs font-medium transition-colors"
                    >
                      Details
                    </Link>
                    {isReg ? (
                      <span className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] font-semibold text-xs flex items-center gap-1">
                        <CheckCircle2 size={12} /> Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={isSoldOut || registeringId === event.id}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer
                          ${isSoldOut 
                            ? 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed' 
                            : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}
                      >
                        {registeringId === event.id ? 'Registering...' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
export default Events;
