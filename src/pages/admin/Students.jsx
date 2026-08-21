import React, { useState, useEffect, useMemo } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Search, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getStudentIntelligence();
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Compute unique departments dynamically from real student records
  const uniqueDepartments = useMemo(() => {
    const depts = new Set(students.map(s => s.department).filter(Boolean));
    return ['All', ...Array.from(depts).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = (s.name || '').toLowerCase().includes(search.toLowerCase());
      const deptMatch = (s.department || '').toLowerCase().includes(search.toLowerCase());
      const matchesSearch = !search.trim() || nameMatch || deptMatch;

      const studentCluster = (s.cluster || s.clusterLabel || 'Inactive').toLowerCase();
      const matchesCluster = selectedCluster === 'All' || studentCluster === selectedCluster.toLowerCase();

      const studentDept = (s.department || '').toLowerCase();
      const matchesDept = selectedDept === 'All' || studentDept === selectedDept.toLowerCase();
      
      return matchesSearch && matchesCluster && matchesDept;
    });
  }, [students, search, selectedCluster, selectedDept]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Students Directory</h1>
          <p className="text-xs text-[#64748B] mt-0.5">College-scoped student behavior profiles, engagement clusters, and verified participation rates.</p>
        </div>
        <button
          onClick={fetchStudents}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search student name or dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] transition-colors shadow-xs"
          />
        </div>

        <div>
          <select 
            value={selectedCluster} 
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-3 py-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F] shadow-xs"
          >
            <option value="All">All Behavior Clusters</option>
            <option value="Highly Active">Highly Active</option>
            <option value="Moderately Active">Moderately Active</option>
            <option value="Low Engagement">Low Engagement</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div>
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-3 py-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F] shadow-xs"
          >
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-12 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <AlertCircle size={22} className="mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-semibold text-[#172033]">No students found</h3>
          <p className="text-xs text-[#64748B]">No student participation records found matching the selected criteria for your college.</p>
        </div>
      ) : (
        <div className="border border-[#E2E8F0] bg-[#FFFFFF] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="px-5 py-3.5">Student Profile</th>
                  <th className="px-5 py-3.5">Academic Track</th>
                  <th className="px-5 py-3.5">Behavior Cluster</th>
                  <th className="px-5 py-3.5">Engagement Score</th>
                  <th className="px-5 py-3.5">Attendance Rate</th>
                  <th className="px-5 py-3.5 text-right">College Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredStudents.map(s => {
                  const cluster = s.cluster || s.clusterLabel || 'Inactive';
                  const eventsCount = s.events ?? s.eventsCount ?? 0;
                  const attendanceRate = s.attendance ?? s.attendanceRate ?? 0;
                  const engagement = s.engagement ?? s.engagementScore ?? 0;

                  return (
                    <tr key={s.id} className="hover:bg-[#F8FAFC] text-[#172033] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EEECFF] text-[#FF5A1F] flex items-center justify-center font-bold text-xs">
                            {s?.name ? s.name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-[#172033] block">{s?.name || 'Student'}</span>
                            <span className="text-[10px] text-[#64748B]">{s?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B]">
                        <span>{s.department || 'General'} • Year {s.year || 1}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          cluster === 'Highly Active' ? 'bg-[#EEECFF] text-[#FF5A1F] border-[#FFD2C2]' : 
                          cluster === 'Moderately Active' ? 'bg-[#FFF7F3] text-[#FF5A1F] border-[#BFDBFE]' : 
                          cluster === 'Low Engagement' ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]' :
                          'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                        }`}>
                          <Sparkles size={8} /> {cluster}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#FF5A1F] font-bold">
                        {eventsCount > 0 ? engagement : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold">
                        {eventsCount > 0 ? (
                          <span className={attendanceRate >= 75 ? "text-[#16A34A]" : "text-[#D97706]"}>
                            {attendanceRate}%
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] font-normal">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-[#64748B]">
                        {eventsCount > 0 ? `${eventsCount} events` : '0 events'}
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
export default AdminStudents;
