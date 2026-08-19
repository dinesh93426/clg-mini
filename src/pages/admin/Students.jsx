import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Search, AlertCircle, Sparkles } from 'lucide-react';

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getStudentIntelligence();
        setStudents(res.students);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const getFilteredStudents = () => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.department.toLowerCase().includes(search.toLowerCase());
      const matchesCluster = selectedCluster === 'All' || s.cluster.toLowerCase() === selectedCluster.toLowerCase();
      const matchesDept = selectedDept === 'All' || s.department.toLowerCase() === selectedDept.toLowerCase();
      
      return matchesSearch && matchesCluster && matchesDept;
    });
  };

  const filteredStudents = getFilteredStudents();

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Students Directory</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Campus-wide student behavior profiles, engagement clusters, and check-in rates.</p>
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
            className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
        </div>

        <div>
          <select 
            value={selectedCluster} 
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-3 py-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#4F46E5]"
          >
            <option value="All">All Behavior Clusters</option>
            <option value="Highly Active">Highly Active</option>
            <option value="Moderately Active">Moderately Active</option>
            <option value="Low Activity">Low Activity</option>
          </select>
        </div>

        <div>
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-3 py-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#4F46E5]"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="MBA">MBA</option>
            <option value="ME">ME</option>
            <option value="Civil">Civil</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => <div key={n} className="h-12 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <AlertCircle size={22} className="mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-semibold text-[#172033]">No students found</h3>
          <p className="text-xs text-[#64748B]">Try adjusting your search criteria or cluster filter.</p>
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
                  <th className="px-5 py-3.5 text-right">Events Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] text-[#172033] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EEECFF] text-[#4F46E5] flex items-center justify-center font-bold text-xs">
                          {s?.name ? s.name.charAt(0) : 'S'}
                        </div>
                        <span className="font-semibold text-xs text-[#172033]">{s?.name || 'Student'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#64748B]">
                      <span>{s.department} • {s.year}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        s.cluster === 'Highly Active' ? 'bg-[#EEECFF] text-[#4F46E5] border-[#C7D2FE]' : 
                        s.cluster === 'Moderately Active' ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' : 
                        'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                      }`}>
                        <Sparkles size={8} /> {s.cluster}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#4F46E5] font-bold">{s.engagement}</td>
                    <td className="px-5 py-3.5 text-[#16A34A] font-semibold">{s.attendance}%</td>
                    <td className="px-5 py-3.5 text-right font-medium text-[#64748B]">{s.events} events</td>
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
export default AdminStudents;
