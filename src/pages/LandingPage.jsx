import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { eventService } from '../services/eventService';
import { recommendationService } from '../services/recommendationService';
import { aiService } from '../services/aiService';
import { EventCard } from '../components/events/EventCard';
import { 
  Search, Calendar, MapPin, Users, Sparkles, CheckCircle2, 
  ArrowRight, BrainCircuit, Filter, Layers, Compass, 
  Tag, Send, Bot, User, GraduationCap, LogOut, ChevronRight,
  Clock, Star, Award, Activity, Check, Bookmark, AlertCircle,
  HelpCircle, RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Technical',
  'Workshop',
  'Hackathon',
  'Seminar',
  'Cultural',
  'Sports',
  'Career',
  'Entrepreneurship',
  'Club Activities'
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Information Technology',
  'Electronics & Comm.',
  'Electrical & Electronics',
  'Mechanical Eng.',
  'Civil Eng.',
  'AI & Data Science',
  'AI & Machine Learning'
];

export const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [allEvents, setAllEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  // Interactive AI Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi there! I am your Campus Event Assistant. Ask me about upcoming workshops, hackathons, guest lectures, or seating availability across all departments!'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const isStudent = user && user.role && user.role.toLowerCase() === 'student';

  // 1. Fetch public events on load
  useEffect(() => {
    document.title = isStudent 
      ? `Student Portal | EventIntel AI` 
      : "Campus Events Portal | Discover & Experience Campus Life";

    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const events = await eventService.getEvents();
        setAllEvents(events || []);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [isStudent]);

  // 2. If authenticated student, fetch personalized data (recommendations & registrations)
  useEffect(() => {
    if (!isStudent || !user?.id) return;

    const fetchPersonalizedData = async () => {
      setLoadingRecs(true);
      try {
        const [recs, regs] = await Promise.allSettled([
          recommendationService.getRecommendationsForStudent(user.id),
          eventService.getRegistrations(user.id)
        ]);

        if (recs.status === 'fulfilled' && recs.value) {
          setRecommendations(recs.value);
        }
        if (regs.status === 'fulfilled' && regs.value) {
          setMyRegistrations(regs.value);
        }
      } catch (err) {
        console.warn("Could not load full student personalization:", err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchPersonalizedData();
  }, [isStudent, user?.id]);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Event Registration handler
  const handleRegisterEvent = async (event) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role.toLowerCase() !== 'student') {
      showToast('Only students can register for events.');
      return;
    }

    setRegisteringId(event.id);
    try {
      await eventService.registerForEvent(event.id, user.id);
      showToast(`Successfully registered for ${event.title}!`);
      
      // Refresh registrations and events list
      const [updatedRegs, updatedEvents] = await Promise.all([
        eventService.getRegistrations(user.id),
        eventService.getEvents()
      ]);
      setMyRegistrations(updatedRegs || []);
      setAllEvents(updatedEvents || []);
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  };

  // Chat message submit
  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    const query = chatInput.trim();
    if (!query || chatLoading) return;

    const newMessages = [...chatMessages, { role: 'user', text: query }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const studentProfile = isStudent ? {
        department: typeof user.department === 'object' ? user.department?.name : user.department,
        year: user.year,
        interests: Array.isArray(user.interests) 
          ? user.interests.map(i => (typeof i === 'object' ? i.name : i)) 
          : []
      } : null;

      const response = await aiService.sendMessageToAssistant(newMessages, studentProfile);
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: response.text || response.answer || "Here is what I found about campus events.",
          sources: response.sources || []
        }
      ]);
    } catch (err) {
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: "I'm having a little trouble querying the event knowledge base right now. Please try again in a moment."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to extract clean string from potentially nested fields
  const safeString = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val.name || val.title || '';
    return String(val);
  };

  // Filtered Events logic
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const cat = safeString(event.category).toLowerCase();
      const dept = (safeString(event.department) || safeString(event.organizer)).toLowerCase();
      const title = safeString(event.title).toLowerCase();
      const desc = safeString(event.description).toLowerCase();
      const venue = safeString(event.venue).toLowerCase();

      // Category filter
      if (selectedCategory !== 'All') {
        if (cat !== selectedCategory.toLowerCase()) return false;
      }

      // Department filter
      if (selectedDepartment !== 'All Departments') {
        const target = selectedDepartment.toLowerCase();
        if (!dept.includes(target) && !target.includes(dept)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !cat.includes(q) && !dept.includes(q) && !venue.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allEvents, selectedCategory, selectedDepartment, searchQuery]);

  // Featured Events (top 3)
  const featuredEvents = useMemo(() => {
    return allEvents.slice(0, 3);
  }, [allEvents]);

  // Registered event ID set for O(1) checks
  const registeredEventIds = useMemo(() => {
    return new Set(myRegistrations.map(r => r.eventId || r.event?.id));
  }, [myRegistrations]);

  // Events matching student's explicit interests
  const interestEvents = useMemo(() => {
    if (!isStudent || !Array.isArray(user?.interests) || user.interests.length === 0) {
      return allEvents.slice(0, 4);
    }
    const studentInterests = user.interests.map(i => safeString(i).toLowerCase()).filter(Boolean);
    if (studentInterests.length === 0) return allEvents.slice(0, 4);

    return allEvents.filter(e => {
      const cat = safeString(e.category).toLowerCase();
      const title = safeString(e.title).toLowerCase();
      const desc = safeString(e.description).toLowerCase();
      return studentInterests.some(i => cat.includes(i) || title.includes(i) || desc.includes(i));
    }).slice(0, 4);
  }, [allEvents, isStudent, user?.interests]);

  const studentInterestsList = useMemo(() => {
    if (!Array.isArray(user?.interests) || user.interests.length === 0) {
      return ['Technology', 'Workshops', 'Coding'];
    }
    return user.interests.map(i => safeString(i)).filter(Boolean);
  }, [user?.interests]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans selection:bg-[#EEF2FF] selection:text-[#4F46E5]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172033] text-white px-4 py-3 rounded-xl shadow-lg border border-[#334155] text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER / NAVIGATION ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-xs group-hover:bg-[#4338CA] transition-colors">
              <BrainCircuit size={20} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#172033]">
                EventIntel <span className="text-[#4F46E5]">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                Campus Portal
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#64748B]">
            <a href="#events-section" className="hover:text-[#172033] transition-colors">
              Discover Events
            </a>
            <a href="#categories-section" className="hover:text-[#172033] transition-colors">
              Categories
            </a>
            {isStudent && (
              <>
                <a href="#recommended-section" className="hover:text-[#4F46E5] transition-colors flex items-center gap-1 text-[#4F46E5] font-semibold">
                  <Sparkles size={13} /> Recommended
                </a>
                <a href="#my-events-section" className="hover:text-[#172033] transition-colors">
                  My Registrations
                </a>
              </>
            )}
            <a href="#assistant-section" className="hover:text-[#172033] transition-colors flex items-center gap-1">
              <Bot size={14} className="text-[#4F46E5]" /> AI Assistant
            </a>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={`/${user.role.toLowerCase()}/dashboard`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors shadow-xs"
                >
                  <GraduationCap size={15} />
                  <span>Go to {user.role === 'STUDENT' ? 'Dashboard' : `${user.role} Portal`}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2]/30 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#172033] hover:text-[#4F46E5] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-xs transition-colors"
                >
                  Register Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="flex-1">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SCENARIO A: AUTHENTICATED STUDENT PERSONALIZED HERO            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {isStudent ? (
          <section className="bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] border-b border-[#E2E8F0] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Personalized Welcome Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#E2E8F0]">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-xs font-medium border border-[#C7D2FE] mb-2.5">
                    <Sparkles size={13} />
                    <span>Personalized Student Event Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
                    Welcome back, {safeString(user.name) || 'Student'} 👋
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
                    Here are campus events and workshops selected for you in <span className="font-semibold text-[#172033]">{safeString(user.department) || 'Computer Science'}</span> ({safeString(user.year) || '3rd Year'}).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/student/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFFFF] border border-[#CBD5E1] text-[#172033] hover:border-[#4F46E5] hover:text-[#4F46E5] shadow-xs transition-all"
                  >
                    <span>Open Student Dashboard</span>
                    <ArrowRight size={14} />
                  </Link>
                  <a
                    href="#assistant-section"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-xs transition-colors"
                  >
                    <Bot size={15} />
                    <span>Ask EventIntel AI</span>
                  </a>
                </div>
              </div>

              {/* Personalized KPI Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between text-[#64748B] text-xs font-medium mb-1">
                    <span>Events Registered</span>
                    <CheckCircle2 size={16} className="text-[#10B981]" />
                  </div>
                  <div className="text-2xl font-bold text-[#172033]">
                    {myRegistrations.length}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Active registrations</div>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between text-[#64748B] text-xs font-medium mb-1">
                    <span>Upcoming Events</span>
                    <Calendar size={16} className="text-[#4F46E5]" />
                  </div>
                  <div className="text-2xl font-bold text-[#172033]">
                    {allEvents.length}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Across 8 departments</div>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between text-[#64748B] text-xs font-medium mb-1">
                    <span>Recommended For You</span>
                    <Sparkles size={16} className="text-[#8B5CF6]" />
                  </div>
                  <div className="text-2xl font-bold text-[#172033]">
                    {recommendations.length > 0 ? recommendations.length : 4}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">AI profile matching</div>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between text-[#64748B] text-xs font-medium mb-1">
                    <span>Student Profile</span>
                    <Activity size={16} className="text-[#F59E0B]" />
                  </div>
                  <div className="text-sm font-bold text-[#172033] truncate">
                    {safeString(user.department) || 'Active Student'}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    {studentInterestsList.length} topics saved
                  </div>
                </div>
              </div>

            </div>
          </section>
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* SCENARIO B: PUBLIC HERO (ANONYMOUS CAMPUS EXPLORATION)        */
          /* ═══════════════════════════════════════════════════════════════ */
          <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#FFFFFF] border-b border-[#E2E8F0] py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Hero Content */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-xs font-semibold">
                  <GraduationCap size={15} />
                  <span>College Campus Event Portal</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight leading-[1.15]">
                  Discover What's Happening on Campus.
                </h1>

                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl">
                  Discover workshops, hackathons, seminars, cultural programs, sports, career events, and activities happening across your campus.
                </p>

                {/* Search Quick Bar in Hero */}
                <div className="bg-[#FFFFFF] border border-[#CBD5E1] p-2 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-2 max-w-xl">
                  <div className="flex items-center gap-2 flex-1 w-full pl-3 text-[#94A3B8]">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search events, workshops, hackathons, seminars..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none bg-transparent py-1.5"
                    />
                  </div>
                  <a
                    href="#events-section"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold hover:bg-[#4338CA] transition-colors shrink-0 text-center shadow-xs"
                  >
                    Explore Events
                  </a>
                </div>

                {/* Hero CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="#events-section"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#172033] text-white text-xs font-semibold hover:bg-[#334155] transition-colors shadow-xs"
                  >
                    <span>Browse All Events</span>
                    <ArrowRight size={14} />
                  </a>

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#CBD5E1] text-[#172033] text-xs font-semibold hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors shadow-2xs"
                  >
                    <User size={14} />
                    <span>Sign In to Personalize</span>
                  </Link>
                </div>

                {/* Public Trust Points */}
                <div className="flex items-center gap-6 pt-4 text-xs text-[#64748B]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-[#10B981]" />
                    <span>Official University Clubs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-[#10B981]" />
                    <span>Instant Registration</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-[#10B981]" />
                    <span>Seat Tracking</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Featured Campus Events Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#64748B] px-1 font-semibold">
                  <span className="uppercase tracking-wider text-[11px] text-[#4F46E5] flex items-center gap-1.5">
                    <Sparkles size={13} /> Featured Events
                  </span>
                  <span>{allEvents.length} Active Events</span>
                </div>

                {loadingEvents ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-32 bg-[#E2E8F0]/60 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  featuredEvents.slice(0, 2).map((event) => (
                    <div 
                      key={event.id}
                      className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#EEF2FF]">
                        <img 
                          src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400"}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#EEF2FF] text-[#4F46E5] uppercase">
                          {safeString(event.category)}
                        </span>
                        <h4 className="text-xs font-bold text-[#172033] truncate">
                          {safeString(event.title)}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {safeString(event.date)}
                          </span>
                          <span className="truncate flex items-center gap-1">
                            <MapPin size={12} /> {safeString(event.venue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: RECOMMENDED FOR YOU (AUTHENTICATED STUDENT ONLY)      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {isStudent && (
          <section id="recommended-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-1">
                  <Sparkles size={14} /> AI Recommendation Engine
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#172033]">
                  Recommended For You
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Ranked by your department focus, registered topics, and campus participation patterns.
                </p>
              </div>

              <Link 
                to="/student/recommendations"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA]"
              >
                <span>View all matches</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {loadingRecs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-[#E2E8F0]/60 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {recommendations.slice(0, 4).map(event => (
                  <div key={event.id} className="flex flex-col">
                    <EventCard 
                      event={event}
                      onRegister={() => handleRegisterEvent(event)}
                      registered={registeredEventIds.has(event.id)}
                      registering={registeringId === event.id}
                    />
                    {/* Why this event explanation badge */}
                    {event.recommendationReason && (
                      <div className="mt-2 p-2 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE]/60 text-[11px] text-[#4F46E5] flex items-start gap-1.5">
                        <Sparkles size={13} className="shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">
                          {safeString(event.recommendationReason)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl">
                <BrainCircuit size={28} className="mx-auto text-[#94A3B8] mb-2" />
                <p className="text-xs font-semibold text-[#172033]">We're learning your interests</p>
                <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                  Explore and register for some events below to unlock personalized recommendations tailored to your studies!
                </p>
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: MY UPCOMING EVENTS (AUTHENTICATED STUDENT ONLY)       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {isStudent && myRegistrations.length > 0 && (
          <section id="my-events-section" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#172033] flex items-center gap-2">
                  <Bookmark size={20} className="text-[#4F46E5]" />
                  My Registered Events
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Events you have joined on campus.
                </p>
              </div>
              <Link 
                to="/student/my-events"
                className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1"
              >
                <span>Manage registrations ({myRegistrations.length})</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRegistrations.slice(0, 3).map((reg) => {
                const ev = reg.event || allEvents.find(e => e.id === reg.eventId) || {};
                return (
                  <div 
                    key={reg.id || reg.eventId}
                    className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                        Registered ✓
                      </span>
                      <h4 className="text-xs font-bold text-[#172033] truncate">
                        {safeString(ev.title) || 'Campus Event'}
                      </h4>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {safeString(ev.date) || 'Upcoming'}
                        </span>
                        <span className="truncate flex items-center gap-1">
                          <MapPin size={12} /> {safeString(ev.venue) || 'Campus Venue'}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/events/${ev.id || reg.eventId}`}
                      className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#172033] hover:border-[#4F46E5] hover:text-[#4F46E5] shrink-0 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: BASED ON YOUR INTERESTS (AUTHENTICATED STUDENT ONLY)  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {isStudent && (
          <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#172033]">
                  Based on Your Interests
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-xs text-[#64748B]">Matching topics:</span>
                  {studentInterestsList.map((tag, tIdx) => (
                    <span key={tIdx} className="text-[11px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-medium border border-[#E2E8F0]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {interestEvents.map(event => (
                <EventCard 
                  key={event.id}
                  event={event}
                  onRegister={() => handleRegisterEvent(event)}
                  registered={registeredEventIds.has(event.id)}
                  registering={registeringId === event.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: PUBLIC EVENT DISCOVERY & SEARCH                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="events-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-1">
                <Compass size={14} /> Campus Exploration
              </div>
              <h2 className="text-2xl font-bold text-[#172033]">
                Upcoming Campus Events
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Explore all verified technical workshops, cultural fests, sports tournaments, and conferences.
              </p>
            </div>
            
            <div className="text-xs text-[#64748B] font-medium">
              Showing <span className="font-bold text-[#172033]">{filteredEvents.length}</span> of {allEvents.length} events
            </div>
          </div>

          {/* Search & Multi-Filter Controls */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs mb-8 space-y-4">
            
            {/* Top row: Search and Department dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Find your next campus event by title, venue, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:bg-[#FFFFFF] transition-all"
                />
              </div>

              <div className="md:col-span-4">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F46E5] transition-colors"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom row: Category Pills */}
            <div id="categories-section" className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer
                    ${selectedCategory === cat 
                      ? 'bg-[#4F46E5] text-white shadow-2xs' 
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-72 bg-[#E2E8F0]/60 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={() => handleRegisterEvent(event)}
                  registered={registeredEventIds.has(event.id)}
                  registering={registeringId === event.id}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-8">
              <Compass size={32} className="mx-auto text-[#94A3B8] mb-2" />
              <h3 className="text-sm font-bold text-[#172033]">No matching events found</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Try clearing your search query or selecting a different category from the filters above.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedDepartment('All Departments');
                }}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: AI EVENT ASSISTANT (RAG CHAT WIDGET)                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="assistant-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E8F0]">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-1">
                  <Bot size={15} /> Campus Intelligence
                </div>
                <h3 className="text-xl font-bold text-[#172033]">
                  Ask EventIntel AI Assistant
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Instant conversational answers about schedules, prerequisites, venue locations, and workshops.
                </p>
              </div>

              {/* Sample Question Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "What technical workshops are happening?",
                  "Which events have seats left?",
                  "Tell me about the hackathons"
                ].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setChatInput(q);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#4F46E5] hover:border-[#C7D2FE] transition-colors"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Conversation Thread */}
            <div className="py-4 space-y-3 max-h-80 overflow-y-auto pr-2">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 border border-[#C7D2FE]">
                      <Bot size={15} />
                    </div>
                  )}

                  <div className={`max-w-xl p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#4F46E5] text-white rounded-tr-none' 
                      : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Cited Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B]">
                        <span className="font-semibold">Sources: </span>
                        {msg.sources.map((s, sIdx) => (
                          <span key={sIdx} className="font-medium text-[#4F46E5] mr-2">
                            [{safeString(s.title) || safeString(s.name) || 'Event'}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-[#172033] text-white flex items-center justify-center shrink-0">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-[#64748B] pl-9">
                  <RefreshCw size={13} className="animate-spin text-[#4F46E5]" />
                  <span>EventIntel AI is querying campus database...</span>
                </div>
              )}
            </div>

            {/* Chat Input Box */}
            <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-[#E2E8F0] flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask anything about campus events, schedules, or workshops..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:bg-[#FFFFFF] transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="px-4 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold hover:bg-[#4338CA] disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <span>Send</span>
                <Send size={13} />
              </button>
            </form>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PUBLIC CTA BANNER (WHEN LOGGED OUT)                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!user && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-[#172033] to-[#1E293B] text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Experience Your Campus Community
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto mb-6">
                Sign in with your university credentials to get tailored recommendations, track attendance, and register for exclusive student workshops in one click.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/login"
                  className="px-6 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs"
                >
                  Sign In with Student ID
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-xl bg-[#FFFFFF] text-[#172033] text-xs font-semibold hover:bg-[#F8FAFC] transition-colors"
                >
                  Create Student Profile
                </Link>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-[#FFFFFF] border-t border-[#E2E8F0] py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#4F46E5] text-white flex items-center justify-center text-[11px] font-bold">
              EI
            </div>
            <span className="font-semibold text-[#172033]">EventIntel AI</span>
            <span>— University Campus Intelligence & Event Management</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[#172033] transition-colors">Portal Login</Link>
            <Link to="/register" className="hover:text-[#172033] transition-colors">Register</Link>
            <a href="#assistant-section" className="hover:text-[#172033] transition-colors">AI Assistant</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
