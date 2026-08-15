import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Search, SlidersHorizontal, AlertCircle, Sparkles, User } from 'lucide-react';

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
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Students Directory</h1>
        <p className="text-slate-400 text-sm mt-1">Review campus-wide student behavior profiles, engagement clusters, and check-in rates.</p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <select 
            value={selectedCluster} 
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 w-full text-xs text-slate-350 focus:outline-none"
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
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 w-full text-xs text-slate-355 focus:outline-none"
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
        <div className="space-y-4">
          {[1, 2, 3].map(n => <div key={n} className="h-12 bg-slate-900 rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <AlertCircle size={32} className="mx-auto text-slate-650" />
          <h3 className="text-sm font-bold text-white">No students found</h3>
        </div>
      ) : (
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Student Profile</th>
                  <th className="px-6 py-3.5">Academic Track</th>
                  <th className="px-6 py-3.5">Behavior Cluster</th>
                  <th className="px-6 py-3.5">Engagement Score</th>
                  <th className="px-6 py-3.5">Attendance Rate</th>
                  <th className="px-6 py-3.5 text-right">Events Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/20 text-slate-200 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      <span>{s.department} • {s.year}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border
                        ${s.cluster === 'Highly Active' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.15)]' : 
                          s.cluster === 'Moderately Active' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 
                          'bg-slate-850 text-slate-500 border-slate-800'}`}
                      >
                        <Sparkles size={8} className="text-purple-400" /> {s.cluster}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-indigo-400 font-bold">{s.engagement}</td>
                    <td className="px-6 py-3.5 text-emerald-450 font-semibold">{s.attendance}%</td>
                    <td className="px-6 py-3.5 text-right font-medium">{s.events} events</td>
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
