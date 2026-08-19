import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { Search, Calendar, MapPin, AlertCircle } from 'lucide-react';

export const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
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
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.organizer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Events Catalogue</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Global registry of active, draft, and completed campus event campaigns.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search event title or organizer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] transition-colors"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => <div key={n} className="h-12 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <AlertCircle size={22} className="mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-semibold text-[#172033]">No events found</h3>
        </div>
      ) : (
        <div className="border border-[#E2E8F0] bg-[#FFFFFF] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="px-5 py-3.5">Event Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Organizer</th>
                  <th className="px-5 py-3.5">Registrations</th>
                  <th className="px-5 py-3.5">Seating Utilization</th>
                  <th className="px-5 py-3.5 text-right">Scheduled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredEvents.map(e => {
                  const percent = Math.round((e.registrationCount / e.totalSeats) * 100) || 0;
                  return (
                    <tr key={e.id} className="hover:bg-[#F8FAFC] text-[#172033] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-xs text-[#172033]">{e.title}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEECFF] text-[#4F46E5] border border-[#C7D2FE]">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B]">{e.organizer}</td>
                      <td className="px-5 py-3.5 font-medium">{e.registrationCount} / {e.totalSeats}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden shrink-0">
                            <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${Math.min(100, percent)}%` }}></div>
                          </div>
                          <span className="text-[10px] text-[#64748B] font-semibold">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#64748B]">{e.date}</td>
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
export default AdminEvents;
