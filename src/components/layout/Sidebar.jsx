import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Compass, Sparkles, CalendarRange, 
  Bot, Star, User, Users, ClipboardList, 
  BrainCircuit, LineChart, BarChart3, TrendingUp, Settings, 
  ChevronRight, LogOut, Layers
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
          { name: 'AI Assistant', path: '/student/ai-assistant', icon: Bot },
          { name: 'My Feedback', path: '/student/feedback', icon: Star },
          { name: 'Profile', path: '/student/profile', icon: User },
        ];
      case 'organizer':
        return [
          { name: 'Dashboard', path: '/organizer/dashboard', icon: LayoutDashboard },
          { name: 'My Events', path: '/organizer/events', icon: ClipboardList },
          { name: 'Create Event', path: '/organizer/events/create', icon: Layers },
          { name: 'AI Event Generator', path: '/organizer/ai-generator', icon: BrainCircuit, badge: 'AI' },
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
          { name: 'AI Insights', path: '/admin/ai-insights', icon: BrainCircuit },
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
          className="fixed inset-0 z-40 bg-[#0F172A]/20 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Minimal White Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 flex flex-col w-[240px] border-r border-[#E2E8F0] bg-[#FFFFFF] transition-transform duration-150 ease-in-out
        md:translate-x-0 md:sticky md:h-screen shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF5A1F] text-white shrink-0 shadow-xs">
            <BrainCircuit size={17} />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm tracking-tight text-[#172033] leading-none">
              EventIntel <span className="text-[#FF5A1F] font-bold">AI</span>
            </h1>
            <p className="text-[10px] text-[#94A3B8] font-medium tracking-wide uppercase mt-1">
              University Portal
            </p>
          </div>
        </div>

        {/* Minimal Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 group cursor-pointer
                  ${isActive 
                    ? 'bg-[#FFF1EB] text-[#FF5A1F] font-semibold' 
                    : 'text-[#64748B] hover:text-[#FF5A1F] hover:bg-[#FFF7F3]'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon 
                        size={16} 
                        className={`transition-colors shrink-0 ${isActive ? 'text-[#FF5A1F]' : 'text-[#64748B] group-hover:text-[#FF5A1F]'}`} 
                      />
                      <span className="truncate">{link.name}</span>
                    </div>
                    
                    {link.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#FFF1EB] text-[#E94712] border border-[#FFD2C2]">
                        {link.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] mb-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF5A1F] text-white text-[11px] font-semibold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-[#172033] truncate">{user?.name || user?.email || 'User'}</h4>
              <p className="text-[10px] text-[#64748B] truncate capitalize">{(user?.role || role)}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2]/40 transition-colors border border-transparent hover:border-[#FECACA] cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
