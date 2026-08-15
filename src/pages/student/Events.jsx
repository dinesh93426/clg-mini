import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { EventCard } from '../../components/events/EventCard';
import { Search, SlidersHorizontal, LayoutGrid, List, AlertCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';

export const Events = () => {
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [registeringId, setRegisteringId] = useState(null);

  // Modal alert notification
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
      const reg = await eventService.registerForEvent(eventId, user?.id);
      setAlertInfo({
        type: 'success',
        title: 'Registration Confirmed!',
        text: `You have successfully reserved a seat. A calendar invite has been dispatched to ${user?.email}.`
      });
      // Refresh local registrations
      const updatedRegs = await eventService.getRegistrations(user?.id);
      setRegistrations(updatedRegs);
      
      // Update seat counts in local list
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

  // Filter logic on client-side
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.description.toLowerCase().includes(search.toLowerCase()) ||
                          e.organizer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Alert Overlay Modal */}
      {alertInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm text-center space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setAlertInfo(null)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              {alertInfo.type === 'success' ? (
                <CheckCircle2 size={24} className="text-emerald-400" />
              ) : (
                <AlertCircle size={24} className="text-rose-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{alertInfo.title}</h4>
              <p className="text-xs text-slate-400 leading-normal mt-1.5">{alertInfo.text}</p>
            </div>
            <button
              onClick={() => setAlertInfo(null)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Okay, Thanks
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Discover Events</h1>
        <p className="text-slate-400 text-sm mt-1">Explore student activities, professional bootcamps, and cultural festivals.</p>
      </div>

      {/* Search and Filters Tool Panel */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search events, workshops, hackathons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Grid/List View switcher */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-slate-400 transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'hover:text-slate-200'}`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-slate-400 transition-all cursor-pointer ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'hover:text-slate-200'}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Category Horizontal scrollbar */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer
              ${selectedCategory === cat 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expanded filters options drawer (Mock) */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Department</label>
            <select className="bg-slate-900 border border-slate-800 rounded-lg p-2 w-full text-slate-300">
              <option>All Departments</option>
              <option>Computer Science</option>
              <option>Electronics</option>
              <option>Mechanical</option>
            </select>
          </div>
          <div>
            <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Seat Availability</label>
            <select className="bg-slate-900 border border-slate-800 rounded-lg p-2 w-full text-slate-300">
              <option>All Events</option>
              <option>Seats Available</option>
              <option>Sold Out</option>
            </select>
          </div>
          <div>
            <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Schedule</label>
            <select className="bg-slate-900 border border-slate-800 rounded-lg p-2 w-full text-slate-300">
              <option>Anytime</option>
              <option>This Week</option>
              <option>Next Week</option>
              <option>Next Month</option>
            </select>
          </div>
          <div>
            <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Event Type</label>
            <select className="bg-slate-900 border border-slate-800 rounded-lg p-2 w-full text-slate-300">
              <option>All Formats</option>
              <option>Workshop / Lab</option>
              <option>Hackathon</option>
              <option>Cultural / Night</option>
            </select>
          </div>
        </div>
      )}

      {/* Event Grid/List Body */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-80 bg-slate-900 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <AlertCircle size={32} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">No upcoming events found</h3>
          <p className="text-xs text-slate-450 max-w-sm mx-auto">Try clearing search filters or check again later for updates.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
        // List View Row Rendering
        <div className="space-y-4">
          {filteredEvents.map(event => {
            const isReg = registrations.some(r => r.eventId === event.id && r.status !== 'cancelled');
            const isSoldOut = event.availableSeats === 0;
            return (
              <div 
                key={event.id}
                className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-900"
              >
                <div className="flex gap-4 items-center w-full md:w-auto">
                  <img src={event.image} alt={event.title} className="w-16 h-16 object-cover rounded-lg bg-slate-900 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/15">
                        {event.category}
                      </span>
                      {event.aiRecommended && (
                        <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-purple-600/15 text-purple-400 border border-purple-500/20 flex items-center gap-0.5">
                          <Sparkles size={8} /> AI Match
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white mt-1 truncate">{event.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{event.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end text-xs">
                  <div className="text-left text-[10px] text-slate-400">
                    <span className="block font-medium">{event.date}</span>
                    <span className="block text-slate-500 mt-0.5">{event.venue}</span>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 shrink-0">
                    <span className="block font-bold text-white">{event.availableSeats}</span>
                    <span className="block text-slate-500">Seats Left</span>
                  </div>

                  <div className="flex gap-2">
                    {isReg ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 size={10} /> Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={isSoldOut || registeringId === event.id}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer
                          ${isSoldOut 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-500'}`}
                      >
                        {registeringId === event.id ? '...' : 'Register'}
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
