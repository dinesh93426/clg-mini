import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

export const StudentIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentAnalytics = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getStudentIntelligence();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-[#E2E8F0] rounded"></div>
        <div className="h-64 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl"></div>
      </div>
    );
  }

  const COLORS = ['#FF5A1F', '#FF5A1F', '#64748B', '#0284C7'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Student Behavior Intelligence</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Algorithmic analysis of student participation trends and cohort clusters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cluster Share Pie */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">Engagement Cluster Share</h3>
            <div className="h-44 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.clusters}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.clusters.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Student Clusters</span>
            <div className="space-y-1.5">
              {data.clusters.map((entry, idx) => (
                <div key={entry.name} className="flex items-center justify-between text-xs text-[#172033]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-semibold">{entry.value} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dept Bar chart */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Active vs Inactive Cohorts by Department</h3>
          <div className="h-48 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentParticipation} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="dept" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="active" fill="#FF5A1F" radius={[4, 4, 0, 0]} name="Active Cohort" />
                <Bar dataKey="inactive" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Inactive Cohort" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};
export default StudentIntelligence;
