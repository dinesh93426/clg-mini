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
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Events Catalogue</h1>
        <p className="text-slate-400 text-sm mt-1">Global registry of active, draft, and completed campus event campaigns.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search event title or organizer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => <div key={n} className="h-12 bg-slate-900 rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <AlertCircle size={32} className="mx-auto text-slate-655" />
          <h3 className="text-sm font-bold text-white">No events found</h3>
        </div>
      ) : (
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-455 font-bold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Event Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Organizer</th>
                  <th className="px-6 py-3.5">Registrations</th>
                  <th className="px-6 py-3.5">Seating Utilization</th>
                  <th className="px-6 py-3.5 text-right">Scheduled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredEvents.map(e => {
                  const percent = Math.round((e.registrationCount / e.totalSeats) * 100) || 0;
                  return (
                    <tr key={e.id} className="hover:bg-slate-900/20 text-slate-200 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-white">{e.title}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">{e.organizer}</td>
                      <td className="px-6 py-3.5 font-medium">{e.registrationCount} / {e.totalSeats}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden shrink-0">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, percent)}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-400">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-400">{e.date}</td>
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
