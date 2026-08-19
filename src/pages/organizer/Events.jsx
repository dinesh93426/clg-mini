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
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Event Management</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Manage event listings, update schedules, and monitor seating capacity.</p>
        </div>

        <Link
          to="/organizer/events/create"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FF5A1F] hover:bg-[#E94712] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>New Event</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] text-xs font-semibold shrink-0">
        {[
          { id: 'all', label: 'All Events' },
          { id: 'published', label: 'Published / Upcoming' },
          { id: 'completed', label: 'Completed' }
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

      {/* Search Filter Panel */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search by event title, description, or venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] transition-colors"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <AlertCircle size={22} className="mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-semibold text-[#172033]">No events found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">Try adjusting your search terms or create a new event.</p>
        </div>
      ) : (
        <div className="border border-[#E2E8F0] bg-[#FFFFFF] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="px-5 py-3.5">Event Title</th>
                  <th className="px-5 py-3.5">Date & Status</th>
                  <th className="px-5 py-3.5">Registrations / Seats</th>
                  <th className="px-5 py-3.5">Venue</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredEvents.map(e => {
                  const percentSeats = Math.round((e.registrationCount / e.totalSeats) * 100) || 0;
                  const isPast = new Date(e.date) < new Date();
                  
                  return (
                    <tr key={e.id} className="hover:bg-[#F8FAFC] text-[#172033] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={e.image} alt={e.title} className="w-9 h-9 object-cover rounded-lg bg-[#F8FAFC] shrink-0 border border-[#E2E8F0]" />
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FFF1EB] text-[#FF5A1F]">
                              {e.category}
                            </span>
                            <span className="font-semibold text-xs text-[#172033] truncate block mt-0.5 hover:text-[#FF5A1F] transition-colors cursor-pointer" onClick={() => navigate(`/organizer/events/${e.id}/analytics`)}>
                              {e.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[#64748B] text-[11px]">
                            <Calendar size={12} className="text-[#94A3B8]" />
                            <span>{e.date}</span>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isPast ? 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]' : 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                          }`}>
                            {isPast ? 'Completed' : 'Published'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between text-[11px] text-[#64748B]">
                            <span>{e.registrationCount} / {e.totalSeats}</span>
                            <span className="font-semibold text-[#172033]">{percentSeats}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${percentSeats >= 90 ? 'bg-[#D97706]' : 'bg-[#FF5A1F]'}`} style={{ width: `${Math.min(100, percentSeats)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B]">
                        <div className="flex items-center gap-1 max-w-[140px] truncate text-[11px]">
                          <MapPin size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate">{e.venue}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/organizer/events/${e.id}/analytics`)}
                            className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#FF5A1F] border border-[#E2E8F0] transition-colors cursor-pointer"
                            title="Analytics Dashboard"
                          >
                            <BarChart3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#DC2626] border border-[#E2E8F0] transition-colors cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 size={13} />
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
