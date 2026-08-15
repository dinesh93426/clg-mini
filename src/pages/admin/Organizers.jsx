import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Search, ShieldAlert, Star, Building } from 'lucide-react';

export const AdminOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrganizers = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getOrganizersList();
        setOrganizers(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizers();
  }, []);

  const filteredOrganizers = organizers.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Organizers Registry</h1>
        <p className="text-slate-400 text-sm mt-1">Review active coordinators, rating scores, and total events generated.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search coordinator or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(n => <div key={n} className="h-12 bg-slate-900 rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredOrganizers.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <ShieldAlert size={32} className="mx-auto text-slate-655" />
          <h3 className="text-sm font-bold text-white">No organizers found</h3>
        </div>
      ) : (
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-455 font-bold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Coordinator Name</th>
                  <th className="px-6 py-3.5">Faculty Department</th>
                  <th className="px-6 py-3.5">Affiliated Branch / Club</th>
                  <th className="px-6 py-3.5">Events Created</th>
                  <th className="px-6 py-3.5 text-right">Student Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredOrganizers.map(o => (
                  <tr key={o.id} className="hover:bg-slate-900/20 text-slate-200 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-white">{o.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      <span>{o.department}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <Building size={12} className="text-slate-500" />
                        <span>{o.organization}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{o.eventsCount} events</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-amber-400">
                        <Star size={12} fill="currentColor" />
                        <span>{o.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminOrganizers;
