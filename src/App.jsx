import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { useApp } from './hooks/useApp';
import { MOCK_EVENTS, MOCK_STUDENTS_LIST, MOCK_ORGANIZERS_LIST } from './services/mockData';
import { X, Search, Sparkles, User, Calendar, ShieldCheck } from 'lucide-react';

// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { OrganizerLayout } from './layouts/OrganizerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Student pages
import { StudentDashboard } from './pages/student/Dashboard';
import { Events } from './pages/student/Events';
import { EventDetails } from './pages/student/EventDetails';
import { Recommendations } from './pages/student/Recommendations';
import { Registrations } from './pages/student/Registrations';
import { Feedback } from './pages/student/Feedback';
import { AIAssistant } from './pages/student/AIAssistant';
import { Profile as StudentProfile } from './pages/student/Profile';

// Organizer pages
import { OrganizerDashboard } from './pages/organizer/Dashboard';
import { OrganizerEvents } from './pages/organizer/Events';
import { EventCreate } from './pages/organizer/EventCreate';
import { EventAnalytics } from './pages/organizer/EventAnalytics';
import { AIGenerator } from './pages/organizer/AIGenerator';
import { FeedbackIntelligence } from './pages/organizer/Feedback';
import { OrganizerProfile } from './pages/organizer/Profile';
import { Certificates } from './pages/organizer/Certificates';
import { Scanner } from './pages/organizer/Scanner';

// Admin pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminStudents } from './pages/admin/Students';
import { AdminOrganizers } from './pages/admin/Organizers';
import { AdminEvents } from './pages/admin/Events';
import { StudentIntelligence } from './pages/admin/StudentIntelligence';
import { EventIntelligence } from './pages/admin/EventIntelligence';
import { SentimentIntelligence } from './pages/admin/FeedbackIntelligence';
import { AdminRecommendations } from './pages/admin/Recommendations';
import { Predictions } from './pages/admin/Predictions';
import { AIInsights } from './pages/admin/AIInsights';
import { Settings } from './pages/admin/Settings';

// Global Search Command Palette overlay
const CommandPalette = () => {
  const { showSearchModal, setShowSearchModal } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // ESC key listener to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };
    if (showSearchModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchModal]);

  if (!showSearchModal) return null;

  const filteredEvents = MOCK_EVENTS.filter(e => 
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredStudents = user?.role === 'admin' 
    ? MOCK_STUDENTS_LIST.filter(s => s.name.toLowerCase().includes(query.toLowerCase())) 
    : [];

  const filteredOrganizers = user?.role === 'admin' 
    ? MOCK_ORGANIZERS_LIST.filter(o => o.name.toLowerCase().includes(query.toLowerCase())) 
    : [];

  const handleSelect = (path) => {
    setShowSearchModal(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-slate-950 border border-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-900">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            autoFocus
            placeholder="Search events, students, coordinators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-650 focus:outline-none"
          />
          <button 
            onClick={() => setShowSearchModal(false)}
            className="text-[10px] text-slate-400 hover:text-white font-mono bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results stream */}
        <div className="max-h-80 overflow-y-auto p-2 text-xs divide-y divide-slate-900">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-500 text-[11px]">
              Type search keywords to scan the campus Operating System...
            </div>
          ) : (
            <>
              {/* Events group */}
              {filteredEvents.length > 0 && (
                <div className="py-2.5">
                  <span className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Events</span>
                  {filteredEvents.map(e => (
                    <button
                      key={e.id}
                      onClick={() => handleSelect(user?.role === 'student' ? `/student/events/${e.id}` : `/organizer/events/${e.id}/analytics`)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-900 text-white flex justify-between items-center cursor-pointer"
                    >
                      <span className="truncate pr-4">{e.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold">{e.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Students group */}
              {filteredStudents.length > 0 && (
                <div className="py-2.5">
                  <span className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Students (Admin access)</span>
                  {filteredStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect('/admin/student-intelligence')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-900 text-white flex justify-between items-center cursor-pointer"
                    >
                      <span>{s.name}</span>
                      <span className="text-[9px] text-slate-450">{s.department}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Organizers group */}
              {filteredOrganizers.length > 0 && (
                <div className="py-2.5">
                  <span className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Coordinators (Admin access)</span>
                  {filteredOrganizers.map(o => (
                    <button
                      key={o.id}
                      onClick={() => handleSelect('/admin/organizers')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-900 text-white flex justify-between items-center cursor-pointer"
                    >
                      <span>{o.name}</span>
                      <span className="text-[9px] text-slate-450">{o.organization}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredEvents.length === 0 && filteredStudents.length === 0 && filteredOrganizers.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  No records matching "{query}" found.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Router mapping layout
const AppContent = () => {
  return (
    <>
      <CommandPalette />
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<LandingPage />} />
        
        {/* AUTH PATHS */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* STUDENT PORTAL */}
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/events" element={<Events />} />
          <Route path="/student/events/:id" element={<EventDetails />} />
          <Route path="/student/recommendations" element={<Recommendations />} />
          <Route path="/student/registrations" element={<Registrations />} />
          <Route path="/student/feedback" element={<Feedback />} />
          <Route path="/student/ai-assistant" element={<AIAssistant />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>

        {/* ORGANIZER PORTAL */}
        <Route element={<OrganizerLayout />}>
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/events" element={<OrganizerEvents />} />
          <Route path="/organizer/events/create" element={<EventCreate />} />
          <Route path="/organizer/events/:id/analytics" element={<EventAnalytics />} />
          <Route path="/organizer/events/:id/certificates" element={<Certificates />} />
          <Route path="/organizer/events/:id/scanner" element={<Scanner />} />
          <Route path="/organizer/ai-generator" element={<AIGenerator />} />
          <Route path="/organizer/feedback" element={<FeedbackIntelligence />} />
          <Route path="/organizer/profile" element={<OrganizerProfile />} />
        </Route>

        {/* ADMIN PORTAL */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/organizers" element={<AdminOrganizers />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/student-intelligence" element={<StudentIntelligence />} />
          <Route path="/admin/event-intelligence" element={<EventIntelligence />} />
          <Route path="/admin/feedback-intelligence" element={<SentimentIntelligence />} />
          <Route path="/admin/recommendations" element={<AdminRecommendations />} />
          <Route path="/admin/predictions" element={<Predictions />} />
          <Route path="/admin/ai-insights" element={<AIInsights />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>

        {/* CATCH-ALL REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
