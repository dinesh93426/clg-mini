import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, GraduationCap, Building2, Tag, ShieldCheck, BrainCircuit, Heart, Plus, Check } from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [interests, setInterests] = useState(user?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    year: user?.year || '1'
  });

  const DEPARTMENT_RECOMMENDATIONS = {
    'Computer Science & Engineering': {
      skills: ['React', 'Node.js', 'Python', 'Machine Learning', 'AWS', 'Docker'],
      interests: ['AI Hackathons', 'Open Source', 'Web3', 'Competitive Programming']
    },
    'Electronics & Communication': {
      skills: ['Verilog', 'IoT', 'Embedded C', 'MATLAB'],
      interests: ['Robotics', 'Signal Processing', 'Circuit Design']
    },
    'Mechanical Engineering': {
      skills: ['AutoCAD', 'SolidWorks', 'Thermodynamics', 'Robotics'],
      interests: ['Automotive', 'Aerospace', 'Manufacturing']
    },
    'Business Administration': {
      skills: ['Excel', 'Marketing', 'Data Analysis', 'Project Management'],
      interests: ['Startup Pitch', 'Finance', 'Consulting']
    }
  };

  const currentRecs = DEPARTMENT_RECOMMENDATIONS[user?.department] || { skills: ['Leadership', 'Communication'], interests: ['Workshops', 'Seminars'] };

  const handleAddSkill = (e, skillToAdd = newSkill) => {
    if (e) e.preventDefault();
    if (skillToAdd.trim() && !skills.includes(skillToAdd.trim())) {
      const updated = [...skills, skillToAdd.trim()];
      setSkills(updated);
      updateProfile({ skills: updated });
      setNewSkill('');
      triggerSuccess();
    }
  };

  const handleAddInterest = (e, interestToAdd = newInterest) => {
    if (e) e.preventDefault();
    if (interestToAdd.trim() && !interests.includes(interestToAdd.trim())) {
      const updated = [...interests, interestToAdd.trim()];
      setInterests(updated);
      updateProfile({ interests: updated });
      setNewInterest('');
      triggerSuccess();
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile(editForm);
    setIsEditing(false);
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">My Profile</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Configure skill tags, interest topics, and review your AI behavioral characteristics.</p>
        </div>

        {success && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] rounded-full text-xs font-semibold">
            <Check size={13} />
            <span>Profile Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Personal info & tags configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Info Card */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3.5">
              <h3 className="text-sm font-bold text-[#172033]">Personal Information</h3>
              <button 
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                className="text-xs font-semibold text-[#FF5A1F] hover:text-[#E94712] px-3 py-1 rounded-lg bg-[#FFF1EB] border border-[#FFD2C2] transition-colors cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1">
                <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Full Name</span>
                <div className="flex items-center gap-2 text-[#172033]">
                  <User size={15} className="text-[#94A3B8] shrink-0" />
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                    />
                  ) : (
                    <span className="font-semibold">{user?.name}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Email Address</span>
                <div className="flex items-center gap-2 text-[#172033]">
                  <Mail size={15} className="text-[#94A3B8] shrink-0" />
                  <span className="font-medium text-[#64748B]">{user?.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Academic Department</span>
                <div className="flex items-center gap-2 text-[#172033]">
                  <Building2 size={15} className="text-[#94A3B8] shrink-0" />
                  {isEditing ? (
                    <select 
                      value={editForm.department} 
                      onChange={e => setEditForm({...editForm, department: e.target.value})}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Business Administration">Business Administration</option>
                    </select>
                  ) : (
                    <span className="font-semibold">{user?.department}</span>
                  )}
                </div>
              </div>

              {user?.year && (
                <div className="space-y-1">
                  <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] block">Enrollment Year</span>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <GraduationCap size={15} className="text-[#94A3B8] shrink-0" />
                    {isEditing ? (
                      <select 
                        value={editForm.year} 
                        onChange={e => setEditForm({...editForm, year: e.target.value})}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    ) : (
                      <span className="font-semibold">{user?.year} Year</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interests and Skills configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Interests card */}
            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-[#172033] flex items-center gap-1.5 uppercase tracking-wider">
                <Heart size={14} className="text-[#DC2626]" />
                <span>Interests</span>
              </h3>
              
              <div className="flex flex-wrap gap-1.5 min-h-[40px] content-start">
                {interests.map(interest => (
                  <span key={interest} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626]">
                    {interest}
                  </span>
                ))}
              </div>

              <div className="space-y-1.5 pt-2.5 border-t border-[#E2E8F0]">
                <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block">Recommended for {user?.department}</span>
                <div className="flex flex-wrap gap-1">
                  {currentRecs.interests.filter(i => !interests.includes(i)).map(rec => (
                    <button 
                      key={rec}
                      onClick={() => handleAddInterest(null, rec)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={10} /> {rec}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddInterest} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Add interest tag..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F]"
                />
                <button type="submit" className="p-1.5 rounded-lg bg-[#FF5A1F] text-white hover:bg-[#E94712] transition-colors cursor-pointer">
                  <Plus size={14} />
                </button>
              </form>
            </div>

            {/* Skills card */}
            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-[#172033] flex items-center gap-1.5 uppercase tracking-wider">
                <Tag size={14} className="text-[#FF5A1F]" />
                <span>Skills</span>
              </h3>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] content-start">
                {skills.map(skill => (
                  <span key={skill} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#FFF1EB] border border-[#FFD2C2] text-[#FF5A1F]">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-1.5 pt-2.5 border-t border-[#E2E8F0]">
                <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block">Recommended for {user?.department}</span>
                <div className="flex flex-wrap gap-1">
                  {currentRecs.skills.filter(s => !skills.includes(s)).map(rec => (
                    <button 
                      key={rec}
                      onClick={() => handleAddSkill(null, rec)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={10} /> {rec}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Add skill tag..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F]"
                />
                <button type="submit" className="p-1.5 rounded-lg bg-[#FF5A1F] text-white hover:bg-[#E94712] transition-colors cursor-pointer">
                  <Plus size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: AI Behavior intelligence */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-[#FF5A1F] text-xs font-bold uppercase tracking-wider">
              <BrainCircuit size={15} />
              <span>AI Behavioral Profile</span>
            </div>

            <div className="divide-y divide-[#E2E8F0] text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-[#64748B]">Activity Level:</span>
                <span className="font-semibold text-[#172033]">{user?.aiProfile?.type || 'Highly Active'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-[#64748B]">Technical Focus:</span>
                <span className="font-semibold text-[#FF5A1F]">{user?.aiProfile?.technicalInterest || 'High'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-[#64748B]">Attendance Index:</span>
                <span className="font-semibold text-[#16A34A]">{user?.aiProfile?.attendanceRate || 87}%</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-[#64748B]">Engagement Score:</span>
                <span className="font-semibold text-[#D97706]">{user?.aiProfile?.engagementScore || 92} / 100</span>
              </div>
            </div>

            <div className="pt-1.5">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1.5">Calculated Core Focus</span>
              <div className="flex flex-wrap gap-1">
                {(user?.aiProfile?.preferredCategories || ['AI', 'Technology', 'Workshops']).map(item => (
                  <span key={item} className="text-[10px] px-2.5 py-0.5 font-semibold rounded-full bg-[#FFF1EB] text-[#FF5A1F] border border-[#FFD2C2]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-[#94A3B8] leading-relaxed border-t border-[#E2E8F0] pt-2.5">
              Behavioral telemetry is updated automatically upon check-in scans. Profile metrics determine recommendation matches.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Profile;
