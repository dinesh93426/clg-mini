import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { useApp } from './hooks/useApp';
import { MOCK_EVENTS, MOCK_STUDENTS_LIST, MOCK_ORGANIZERS_LIST } from './services/mockData';
import { Search } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#0F172A]/30 backdrop-blur-xs">
      <div 
        className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-lg overflow-hidden shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
          <Search size={15} className="text-[#94A3B8]" />
          <input
            type="text"
            autoFocus
            placeholder="Search events, students, coordinators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none"
          />
          <button 
            onClick={() => setShowSearchModal(false)}
            className="text-[10px] text-[#64748B] hover:text-[#172033] font-mono bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results stream */}
        <div className="max-h-80 overflow-y-auto p-2 text-xs divide-y divide-[#E2E8F0]">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-[#94A3B8] text-xs">
              Type search keywords to scan the campus directory...
            </div>
          ) : (
            <>
              {/* Events group */}
              {filteredEvents.length > 0 && (
                <div className="py-2">
                  <span className="px-3 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Events</span>
                  {filteredEvents.map(e => (
                    <button
                      key={e.id}
                      onClick={() => handleSelect(user?.role === 'student' ? `/student/events/${e.id}` : `/organizer/events/${e.id}/analytics`)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-[#172033] flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <span className="truncate pr-4 text-xs font-semibold">{e.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[#EEECFF] text-[#FF5A1F] font-bold">{e.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Students group */}
              {filteredStudents.length > 0 && (
                <div className="py-2">
                  <span className="px-3 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Students (Admin access)</span>
                  {filteredStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect('/admin/student-intelligence')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-[#172033] flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-semibold">{s.name}</span>
                      <span className="text-[11px] text-[#64748B]">{s.department}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Organizers group */}
              {filteredOrganizers.length > 0 && (
                <div className="py-2">
                  <span className="px-3 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Coordinators (Admin access)</span>
                  {filteredOrganizers.map(o => (
                    <button
                      key={o.id}
                      onClick={() => handleSelect('/admin/organizers')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-[#172033] flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-semibold">{o.name}</span>
                      <span className="text-[11px] text-[#64748B]">{o.organization}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredEvents.length === 0 && filteredStudents.length === 0 && filteredOrganizers.length === 0 && (
                <div className="py-8 text-center text-[#94A3B8] text-xs">
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
        
        {/* AUTH */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* STUDENT PORTAL */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* ORGANIZER PORTAL */}
        <Route path="/organizer" element={<OrganizerLayout />}>
          <Route index element={<Navigate to="/organizer/dashboard" replace />} />
          <Route path="dashboard" element={<OrganizerDashboard />} />
          <Route path="events" element={<OrganizerEvents />} />
          <Route path="events/create" element={<EventCreate />} />
          <Route path="events/:id/analytics" element={<EventAnalytics />} />
          <Route path="events/:id/certificates" element={<Certificates />} />
          <Route path="events/:id/scanner" element={<Scanner />} />
          <Route path="ai-generator" element={<AIGenerator />} />
          <Route path="feedback" element={<FeedbackIntelligence />} />
          <Route path="profile" element={<OrganizerProfile />} />
        </Route>

        {/* ADMIN PORTAL */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="organizers" element={<AdminOrganizers />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="student-intelligence" element={<StudentIntelligence />} />
          <Route path="event-intelligence" element={<EventIntelligence />} />
          <Route path="sentiment-intelligence" element={<SentimentIntelligence />} />
          <Route path="recommendations" element={<AdminRecommendations />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* FALLBACK REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
