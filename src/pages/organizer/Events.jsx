import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventService, eventsList } from '../../services/eventService';
import { 
  Search, SlidersHorizontal, Plus, Calendar, MapPin, 
  Trash2, Edit3, BarChart3, AlertCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';

export const OrganizerEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | published | completed

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents();
      // For organizers, simulate listing their events
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this event from the catalogue?")) return;
    
    // Mutate the mock in-memory database directly for Demo Mode persistency
    const idx = eventsList.findIndex(e => e.id === id);
    if (idx !== -1) {
      eventsList.splice(idx, 1);
      alert('Event deleted.');
      loadEvents();
    }
  };

  const getFilteredEvents = () => {
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                            e.description.toLowerCase().includes(search.toLowerCase()) ||
                            e.venue.toLowerCase().includes(search.toLowerCase());
      
      const isPast = new Date(e.date) < new Date();
      if (activeTab === 'published') {
        return matchesSearch && !isPast;
      }
      if (activeTab === 'completed') {
        return matchesSearch && isPast;
      }
      return matchesSearch;
    });
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Event Management</h1>
          <p className="text-slate-400 text-sm mt-1">Review active rosters, update schedules, and monitor seating capacity.</p>
        </div>

        <Link
          to="/organizer/events/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
        >
          <Plus size={14} />
          <span>Manual Event Creation</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900 text-xs font-bold shrink-0">
        {[
          { id: 'all', label: 'All Campaigns' },
          { id: 'published', label: 'Active / Published' },
          { id: 'completed', label: 'Completed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer
              ${activeTab === tab.id 
                ? 'border-indigo-500 text-indigo-400 font-semibold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Filter Panel */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search event title, description or venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-slate-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <AlertCircle size={32} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">No campaigns found</h3>
          <p className="text-xs text-slate-450 max-w-sm mx-auto">Try adjust search tags or create a new campaign using AI generation draft sheets.</p>
        </div>
      ) : (
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Event Campaign</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Registrations / Seats</th>
                  <th className="px-6 py-4">Venue & Block</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredEvents.map(e => {
                  const percentSeats = Math.round((e.registrationCount / e.totalSeats) * 100) || 0;
                  const isPast = new Date(e.date) < new Date();
                  
                  return (
                    <tr key={e.id} className="hover:bg-slate-900/20 text-slate-200 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={e.image} alt={e.title} className="w-10 h-10 object-cover rounded-lg bg-slate-900 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                              {e.category}
                            </span>
                            <span className="font-semibold text-white truncate block mt-1 hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => navigate(`/organizer/events/${e.id}/analytics`)}>
                              {e.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-350">
                            <Calendar size={12} className="text-slate-500" />
                            <span>{e.date}</span>
                          </div>
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isPast ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {isPast ? 'Completed' : 'Published'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 max-w-[120px]">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{e.registrationCount} / {e.totalSeats} seats</span>
                            <span className="font-semibold text-white">{percentSeats}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${percentSeats >= 90 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, percentSeats)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex items-center gap-1.5 max-w-[150px] truncate">
                          <MapPin size={12} className="text-slate-500 shrink-0" />
                          <span className="truncate">{e.venue}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/organizer/events/${e.id}/analytics`)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-800 transition-colors"
                            title="Analytics Dashboard"
                          >
                            <BarChart3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/20 text-slate-450 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
export default OrganizerEvents;
