import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, GraduationCap, Building2, Tag, ShieldCheck, BrainCircuit, Heart, Plus } from 'lucide-react';

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
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Configure interest tags and review your AI behavioral characteristics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal info & tags configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Info Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-white">Personal Information</h3>
              <button 
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 transition-all cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Full Name</span>
                <div className="flex items-center gap-2 text-slate-200 py-1">
                  <User size={14} className="text-slate-500 shrink-0" />
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span>{user?.name}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Email Address</span>
                <div className="flex items-center gap-2 text-slate-200 py-1">
                  <Mail size={14} className="text-slate-500 shrink-0" />
                  <span className="opacity-70">{user?.email} (Cannot edit)</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Academic Department</span>
                <div className="flex items-center gap-2 text-slate-200 py-1">
                  <Building2 size={14} className="text-slate-500 shrink-0" />
                  {isEditing ? (
                    <select 
                      value={editForm.department} 
                      onChange={e => setEditForm({...editForm, department: e.target.value})}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Computer Science & Engineering">CSE</option>
                      <option value="Electronics & Communication">ECE</option>
                      <option value="Mechanical Engineering">ME</option>
                      <option value="Business Administration">MBA</option>
                    </select>
                  ) : (
                    <span>{user?.department}</span>
                  )}
                </div>
              </div>

              {user?.year && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Enrollment Year</span>
                  <div className="flex items-center gap-2 text-slate-200 py-1">
                    <GraduationCap size={14} className="text-slate-500 shrink-0" />
                    {isEditing ? (
                      <select 
                        value={editForm.year} 
                        onChange={e => setEditForm({...editForm, year: e.target.value})}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    ) : (
                      <span>{user?.year}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interests and Skills configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Interests card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Heart size={14} className="text-rose-400" />
                <span>Interests</span>
              </h3>
              
              <div className="flex flex-wrap gap-1.5 min-h-[60px] content-start">
                {interests.map(interest => (
                  <span key={interest} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-350">
                    {interest}
                  </span>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-900">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Recommended for {user?.department}</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentRecs.interests.filter(i => !interests.includes(i)).map(rec => (
                    <button 
                      key={rec}
                      onClick={() => handleAddInterest(null, rec)}
                      className="text-[9px] px-2 py-0.5 rounded border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={10} /> {rec}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddInterest} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add interest tag..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button type="submit" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer">
                  <Plus size={14} />
                </button>
              </form>
            </div>

            {/* Skills card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag size={14} className="text-indigo-400" />
                <span>Skills</span>
              </h3>

              <div className="flex flex-wrap gap-1.5 min-h-[60px] content-start">
                {skills.map(skill => (
                  <span key={skill} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-350">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-900">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Recommended for {user?.department}</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentRecs.skills.filter(s => !skills.includes(s)).map(rec => (
                    <button 
                      key={rec}
                      onClick={() => handleAddSkill(null, rec)}
                      className="text-[9px] px-2 py-0.5 rounded border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={10} /> {rec}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill tag..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button type="submit" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer">
                  <Plus size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: AI Behavior intelligence */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-purple-500/15 bg-gradient-to-b from-purple-500/5 to-transparent space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <BrainCircuit size={16} className="animate-pulse" />
              <span>AI Behavioral Profile</span>
            </div>

            <div className="divide-y divide-slate-900 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Activity Level:</span>
                <span className="font-bold text-white">{user?.aiProfile?.type || 'Highly Active'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Technical Focus:</span>
                <span className="font-bold text-indigo-400">{user?.aiProfile?.technicalInterest || 'High'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Attendance Index:</span>
                <span className="font-bold text-emerald-450">{user?.aiProfile?.attendanceRate || 87}%</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Engagement Score:</span>
                <span className="font-bold text-pink-400">{user?.aiProfile?.engagementScore || 92} / 100</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Calculated Core Focus</span>
              <div className="flex flex-wrap gap-1.5">
                {(user?.aiProfile?.preferredCategories || ['AI', 'Technology', 'Workshops']).map(item => (
                  <span key={item} className="text-[9px] px-2.5 py-0.5 font-bold rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/15">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal border-t border-slate-900 pt-3">
              *Your behavioral logs are updated automatically upon check-in scans. Profile metrics determine recommendation matches.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Profile;
