import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Building2, ShieldCheck, CalendarRange } from 'lucide-react';

export const OrganizerProfile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Organizer Profile</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Configure coordinator parameters and verify institutional permissions.</p>
      </div>

      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">Personal Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Full Name</span>
            <div className="flex items-center gap-2 text-[#172033] py-0.5 font-semibold">
              <User size={14} className="text-[#94A3B8]" />
              <span>{user?.name || 'Sarah Carter'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Email Address</span>
            <div className="flex items-center gap-2 text-[#64748B] py-0.5 font-medium">
              <Mail size={14} className="text-[#94A3B8]" />
              <span>{user?.email || 'sarah.carter@university.edu'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Faculty Department</span>
            <div className="flex items-center gap-2 text-[#172033] py-0.5 font-semibold">
              <Building2 size={14} className="text-[#94A3B8]" />
              <span>{user?.department || 'Computer Science Department'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Affiliated Organization</span>
            <div className="flex items-center gap-2 text-[#172033] py-0.5 font-semibold">
              <ShieldCheck size={14} className="text-[#16A34A]" />
              <span>{user?.organization || 'IEEE Student Branch & CSE Club'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authority Card */}
      <div className="p-5 rounded-2xl border border-[#FFD2C2] bg-[#FFFFFF] shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-[#172033] flex items-center gap-1.5 uppercase tracking-wider">
          <CalendarRange size={15} className="text-[#FF5A1F]" />
          <span>Organizer Authority Roster</span>
        </h4>
        <p className="text-xs text-[#64748B] leading-relaxed">
          As a registered coordinator, you are authorized to publish event drafts directly to the campus activity catalog. Seating configurations, attendance checklists, and feedback sentiment aggregation indices are computed dynamically for all published events.
        </p>
      </div>

    </div>
  );
};
export default OrganizerProfile;
