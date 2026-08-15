import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Compass, Sparkles, CalendarRange, 
  Bot, Star, User, Users, ClipboardList, 
  BrainCircuit, LineChart, BarChart3, TrendingUp, Settings, 
  ChevronRight, LogOut, Terminal, Layers
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = (user?.role || 'student').toLowerCase();

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { name: 'Explore Events', path: '/student/events', icon: Compass },
          { name: 'Recommended', path: '/student/recommendations', icon: Sparkles, badge: 'AI' },
          { name: 'My Registrations', path: '/student/registrations', icon: CalendarRange },
          { name: 'AI Assistant', path: '/student/ai-assistant', icon: Bot, glow: true },
          { name: 'My Feedback', path: '/student/feedback', icon: Star },
          { name: 'Profile', path: '/student/profile', icon: User },
        ];
      case 'organizer':
        return [
          { name: 'Dashboard', path: '/organizer/dashboard', icon: LayoutDashboard },
          { name: 'My Events', path: '/organizer/events', icon: ClipboardList },
          { name: 'Create Event', path: '/organizer/events/create', icon: Layers },
          { name: 'AI Event Generator', path: '/organizer/ai-generator', icon: BrainCircuit, badge: 'AI', glow: true },
          { name: 'Feedback Intelligence', path: '/organizer/feedback', icon: Star },
          { name: 'Profile', path: '/organizer/profile', icon: User },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Students', path: '/admin/students', icon: Users },
          { name: 'Organizers', path: '/admin/organizers', icon: Users },
          { name: 'Events', path: '/admin/events', icon: ClipboardList },
          { name: 'Student Intelligence', path: '/admin/student-intelligence', icon: LineChart, badge: 'AI' },
          { name: 'Event Intelligence', path: '/admin/event-intelligence', icon: BarChart3 },
          { name: 'Feedback Intelligence', path: '/admin/feedback-intelligence', icon: Star },
          { name: 'Recommendations', path: '/admin/recommendations', icon: Sparkles },
          { name: 'Predictions', path: '/admin/predictions', icon: TrendingUp, badge: 'AI' },
          { name: 'AI Insights', path: '/admin/ai-insights', icon: BrainCircuit, glow: true },
          { name: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinks();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 border-r border-slate-800 bg-slate-950/90 backdrop-blur-md transition-transform duration-300
        md:translate-x-0 md:sticky md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-900">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <BrainCircuit size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-white leading-none">
              EventIntel <span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
              Campus OS
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Main Navigation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                  ${isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}
                  ${link.glow ? 'after:absolute after:inset-0 after:rounded-lg after:border after:border-purple-500/10 hover:after:border-purple-500/30' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={`transition-colors group-hover:text-indigo-400 ${link.glow ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </div>
                
                {link.badge && (
                  <span className={`
                    text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider
                    ${link.badge === 'AI' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]' 
                      : 'bg-indigo-500/20 text-indigo-300'}
                  `}>
                    {link.badge}
                  </span>
                )}
                
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-slate-900/40 border border-slate-800/40 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-indigo-400 font-bold border border-slate-700">
              {user?.name ? user.name.charAt(0) : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">{user?.name || user?.email || 'User'}</h4>
              <p className="text-[10px] text-slate-500 truncate capitalize">{(user?.role || role)} Portal</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-950/50"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
