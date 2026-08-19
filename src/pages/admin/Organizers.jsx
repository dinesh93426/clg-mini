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
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Organizers Registry</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Review active coordinators, rating scores, and total events generated.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search coordinator or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] transition-colors"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(n => <div key={n} className="h-12 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredOrganizers.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <ShieldAlert size={22} className="mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-semibold text-[#172033]">No organizers found</h3>
        </div>
      ) : (
        <div className="border border-[#E2E8F0] bg-[#FFFFFF] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="px-5 py-3.5">Coordinator Name</th>
                  <th className="px-5 py-3.5">Faculty Department</th>
                  <th className="px-5 py-3.5">Affiliated Branch / Club</th>
                  <th className="px-5 py-3.5">Events Created</th>
                  <th className="px-5 py-3.5 text-right">Student Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredOrganizers.map(o => (
                  <tr key={o.id} className="hover:bg-[#F8FAFC] text-[#172033] transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-xs text-[#172033]">{o.name}</td>
                    <td className="px-5 py-3.5 text-[#64748B]">{o.department}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-[#FF5A1F]">
                        <Building size={12} className="text-[#94A3B8]" />
                        <span>{o.organization}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#172033]">{o.eventsCount} events</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-[#D97706]">
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
