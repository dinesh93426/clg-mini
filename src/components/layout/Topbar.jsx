import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Sparkles, User, RefreshCw, X, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';

export const Topbar = ({ onMenuClick }) => {
  const { user, switchRole } = useAuth();
  const { notifications, markAllRead, removeNotification, setShowSearchModal } = useApp();
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  
  const notifRef = useRef(null);
  const roleRef = useRef(null);

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRoleChange = (role) => {
    switchRole(role);
    setShowRoleSwitcher(false);
    window.location.href = `/${role}/dashboard`;
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'capacity':
        return <AlertTriangle size={15} className="text-[#F59E0B]" />;
      case 'recommendation':
        return <Sparkles size={15} className="text-[#FF5A1F]" />;
      case 'feedback':
        return <ShieldCheck size={15} className="text-[#16A34A]" />;
      default:
        return <Calendar size={15} className="text-[#FF5A1F]" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 md:px-8 border-b border-[#E2E8F0] bg-[#FFFFFF]">
      {/* Left: Mobile hamburger & search trigger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg text-[#64748B] hover:text-[#FF5A1F] hover:bg-[#FFF7F3] md:hidden transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        {/* Global Search Bar Trigger */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="hidden sm:flex items-center gap-2.5 w-64 md:w-80 px-3 py-2 rounded-lg text-left text-[13px] text-[#94A3B8] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] focus:border-[#FF5A1F] transition-colors cursor-pointer"
        >
          <Search size={14} className="text-[#94A3B8]" />
          <span className="truncate">Search events, campus telemetry...</span>
          <kbd className="ml-auto px-1.5 py-0.5 text-[10px] text-[#64748B] bg-[#FFFFFF] rounded border border-[#E2E8F0] font-mono">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: AI status, role switcher, notifications, user profile */}
      <div className="flex items-center gap-3">
        {/* Institutional AI Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"></span>
          <span>AI Engine Active</span>
        </div>

        {/* Quick Role Switcher */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#172033] bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FFB49A] hover:bg-[#FFF7F3] transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className="text-[#FF5A1F]" />
            <span className="hidden md:inline text-[#64748B]">Portal:</span>
            <span className="capitalize text-[#FF5A1F]">{user?.role}</span>
          </button>
          
          {showRoleSwitcher && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-xl shadow-lg border border-[#E2E8F0] bg-[#FFFFFF] p-1.5 divide-y divide-[#E2E8F0] z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                Switch Portal Role
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => handleRoleChange('student')}
                  className={`flex w-full items-center px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${user?.role === 'student' ? 'bg-[#FFF1EB] text-[#FF5A1F]' : 'text-[#64748B] hover:text-[#FF5A1F] hover:bg-[#FFF7F3]'}`}
                >
                  Student Portal
                </button>
                <button
                  onClick={() => handleRoleChange('organizer')}
                  className={`flex w-full items-center px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${user?.role === 'organizer' ? 'bg-[#FFF1EB] text-[#FF5A1F]' : 'text-[#64748B] hover:text-[#FF5A1F] hover:bg-[#FFF7F3]'}`}
                >
                  Organizer Portal
                </button>
                <button
                  onClick={() => handleRoleChange('admin')}
                  className={`flex w-full items-center px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${user?.role === 'admin' ? 'bg-[#FFF1EB] text-[#FF5A1F]' : 'text-[#64748B] hover:text-[#FF5A1F] hover:bg-[#FFF7F3]'}`}
                >
                  Admin Portal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#FF5A1F] hover:bg-[#FFF7F3] transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FF5A1F] text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-1.5 w-80 md:w-96 rounded-xl shadow-lg border border-[#E2E8F0] bg-[#FFFFFF] p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#172033]">Campus Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-[11px] text-[#FF5A1F] hover:text-[#E94712] font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#94A3B8]">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-2.5 relative group transition-colors hover:bg-[#FFF7F3] rounded-lg ${!notif.read ? 'bg-[#FFF1EB]/50' : ''}`}
                    >
                      <div className="flex gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h5 className="text-xs font-semibold text-[#172033] truncate">{notif.title}</h5>
                          <p className="text-[11px] text-[#64748B] leading-normal mt-0.5">{notif.text}</p>
                          <span className="text-[10px] text-[#94A3B8] font-medium block mt-1">{notif.timestamp}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="absolute right-2 top-2 p-1 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF5A1F] text-white font-semibold text-xs select-none shadow-xs">
          {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
