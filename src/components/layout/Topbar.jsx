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
        return <AlertTriangle size={16} className="text-amber-400" />;
      case 'recommendation':
        return <Sparkles size={16} className="text-purple-400 animate-pulse" />;
      case 'feedback':
        return <ShieldCheck size={16} className="text-emerald-400" />;
      default:
        return <Calendar size={16} className="text-indigo-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      {/* Left: Mobile hamburger & search trigger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar Trigger */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="hidden sm:flex items-center gap-3 w-64 md:w-80 px-3 py-1.5 rounded-lg text-left text-xs text-slate-500 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 transition-all cursor-pointer"
        >
          <Search size={14} className="text-slate-400" />
          <span>Search events, students, intelligence...</span>
          <kbd className="ml-auto px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-800 rounded border border-slate-700 font-mono">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: AI status, notifications, switcher, profile */}
      <div className="flex items-center gap-3">
        {/* AI Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/20 bg-purple-500/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className="text-purple-300 font-display flex items-center gap-1 font-semibold">
            <Sparkles size={12} className="text-purple-400" /> AI Engine Active
          </span>
        </div>

        {/* Quick Role Switcher (Sandbox development toolbar) */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className="text-indigo-400 animate-spin-slow" />
            <span className="hidden md:inline">Role:</span>
            <span className="capitalize text-indigo-300">{user?.role}</span>
          </button>
          
          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl border border-slate-800 bg-slate-950 p-1 divide-y divide-slate-900 z-50">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Switch Sandbox Role
              </div>
              <div className="py-1">
                <button
                  onClick={() => handleRoleChange('student')}
                  className={`flex w-full items-center px-3 py-2 text-xs rounded-md ${user?.role === 'student' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                >
                  Student Portal
                </button>
                <button
                  onClick={() => handleRoleChange('organizer')}
                  className={`flex w-full items-center px-3 py-2 text-xs rounded-md ${user?.role === 'organizer' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                >
                  Organizer Portal
                </button>
                <button
                  onClick={() => handleRoleChange('admin')}
                  className={`flex w-full items-center px-3 py-2 text-xs rounded-md ${user?.role === 'admin' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
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
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white shadow-md shadow-indigo-500/25">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-2xl border border-slate-800 bg-slate-950 p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-900">
                <span className="text-xs font-bold text-white">AI Campus Insights</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-900">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3 relative group transition-colors hover:bg-slate-900/40 ${!notif.read ? 'bg-indigo-500/5' : ''}`}
                    >
                      <div className="flex gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h5 className="text-xs font-semibold text-white truncate">{notif.title}</h5>
                          <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{notif.text}</p>
                          <span className="text-[9px] text-slate-500 font-medium block mt-1">{notif.timestamp}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="absolute right-2 top-3 p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Dismiss notification"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge / Profile */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-display font-semibold select-none">
          {user?.name?.charAt(0) || <User size={14} />}
        </div>
      </div>
    </header>
  );
};
