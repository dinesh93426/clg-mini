import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, GraduationCap, Building2, ShieldCheck, CalendarRange } from 'lucide-react';

export const OrganizerProfile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Organizer Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Configure coordinator parameters and check organization registries.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-slate-900 pb-3">Personal Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Full Name</span>
            <div className="flex items-center gap-2 text-slate-200 py-1">
              <User size={14} className="text-slate-500" />
              <span>{user?.name || 'Sarah Carter'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Email Address</span>
            <div className="flex items-center gap-2 text-slate-200 py-1">
              <Mail size={14} className="text-slate-500" />
              <span>{user?.email || 'sarah.carter@university.edu'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Faculty Department</span>
            <div className="flex items-center gap-2 text-slate-200 py-1">
              <Building2 size={14} className="text-slate-500" />
              <span>{user?.department || 'Computer Science Department'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Affiliated Organization</span>
            <div className="flex items-center gap-2 text-slate-200 py-1">
              <ShieldCheck size={14} className="text-slate-500" />
              <span>{user?.organization || 'IEEE Student Branch & CSE Club'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer stats mock card */}
      <div className="p-5 rounded-2xl border border-indigo-500/15 bg-gradient-to-r from-indigo-500/5 to-transparent space-y-4">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <CalendarRange size={16} className="text-indigo-400" />
          <span>Organizer Authority Roster</span>
        </h4>
        <p className="text-xs text-slate-350 leading-relaxed">
          As a registered coordinator, you are authorized to publish event drafts directly to the campus activity catalog. Seating configurations, attendance checklists, and feedback sentiment aggregation indices are computed dynamically for all published events.
        </p>
      </div>

    </div>
  );
};
export default OrganizerProfile;
