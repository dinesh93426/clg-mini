import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BrainCircuit, Sparkles, BarChart3, Users, Compass, 
  CalendarRange, CheckCircle2, ArrowRight, ShieldAlert, Cpu,
  TrendingUp, MessageSquare, ShieldCheck, Zap, Activity, Clock,
  ArrowUpRight, ChevronRight, Play, Quote, Check, Info, AlertTriangle,
  Lightbulb, Database, Network, Eye, RefreshCw, Layers, Star, Image, HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// Custom CountUp Component using requestAnimationFrame for smooth numeric counting
const CountUp = ({ end, duration = 1.5, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);
  
  return (
    <span ref={elementRef}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState('organizer');

  useEffect(() => {
    document.title = "EventIntel AI | Enterprise Campus Event Intelligence Platform";
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStart = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  // Light theme mock chart data
  const heroEngagementData = [
    { week: 'W1', score: 62 },
    { week: 'W2', score: 68 },
    { week: 'W3', score: 74 },
    { week: 'W4', score: 87 },
  ];

  const engagementTrend = [
    { name: 'Mon', registrations: 45, attendance: 42 },
    { name: 'Tue', registrations: 68, attendance: 65 },
    { name: 'Wed', registrations: 71, attendance: 70 },
    { name: 'Thu', registrations: 85, attendance: 82 },
    { name: 'Fri', registrations: 95, attendance: 92 },
    { name: 'Sat', registrations: 60, attendance: 58 },
    { name: 'Sun', registrations: 90, attendance: 88 },
  ];

  const categoryBreakdown = [
    { name: 'Workshop', value: 90 },
    { name: 'Hackathon', value: 60 },
    { name: 'Seminar', value: 45 },
    { name: 'Technical', value: 30 }
  ];

  const aiModules = [
    {
      id: "01",
      title: "Student Behavior Intelligence",
      algorithm: "K-Means Clustering (k=3)",
      description: "Discovers student engagement archetypes (Highly Active, Moderately Active, Low Engagement) to drive personalized retention.",
      icon: Users
    },
    {
      id: "02",
      title: "Feedback Sentiment Engine",
      algorithm: "Fine-Tuned RoBERTa Transformer",
      description: "Classifies qualitative event comments into Positive, Neutral, or Negative sentiment with 100% evaluated benchmark accuracy.",
      icon: MessageSquare
    },
    {
      id: "03",
      title: "Event Demand Prediction",
      algorithm: "Ridge Regression + Random Forest",
      description: "Forecasts expected registration volume before event launch to prevent venue capacity bottlenecks.",
      icon: TrendingUp
    },
    {
      id: "04",
      title: "Personalized Recommendation",
      algorithm: "Hybrid TF-IDF + Cosine Similarity",
      description: "Matches upcoming seminars and workshops to individual student profiles with 100% precision@5 metrics.",
      icon: Sparkles
    },
    {
      id: "05",
      title: "RAG AI Event Assistant",
      algorithm: "Retrieval-Augmented Generation",
      description: "Campus-grounded AI conversational assistant that strictly answers verified event questions without hallucinations.",
      icon: BrainCircuit
    },
    {
      id: "06",
      title: "AI Event Poster Generator",
      algorithm: "Visual Prompt Synthesis",
      description: "Generates high-resolution academic posters with layout composition, badges, and typography.",
      icon: Image
    },
    {
      id: "07",
      title: "AI Event Analytics & Insights",
      algorithm: "Statistical Telemetry Aggregator",
      description: "Computes institutional attendance conversion, category leaderboards, and departmental engagement scores.",
      icon: BarChart3
    },
    {
      id: "08",
      title: "Early Warning System",
      algorithm: "Rule-Based Risk Engine",
      description: "Scans active events in real-time to flag capacity overloads, low registration paces, and negative feedback spikes.",
      icon: ShieldAlert
    },
    {
      id: "09",
      title: "Automated Certificate Engine",
      algorithm: "Cryptographic Attendance Verification",
      description: "Generates verifiable digital credentials exclusively for students with recorded event attendance.",
      icon: ShieldCheck
    },
    {
      id: "10",
      title: "Campus Command OS",
      algorithm: "Role-Based Access Control",
      description: "Centralized dual-role dashboards tailored for Event Organizers and University Administrators.",
      icon: Layers
    }
  ];

  return (
    <div className="bg-[#F8FAFC] text-[#172033] min-h-screen selection:bg-[#EEF2FF] selection:text-[#4F46E5] relative font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${
        scrolled ? 'bg-[#FFFFFF] border-b border-[#E2E8F0] shadow-xs' : 'bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E2E8F0]'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4F46E5] text-white shadow-xs">
              <BrainCircuit size={17} />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-[#172033]">
                EventIntel <span className="text-[#4F46E5] font-bold">AI</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#64748B]">
            <a href="#modules" className="hover:text-[#172033] transition-colors">AI Modules</a>
            <a href="#dashboard" className="hover:text-[#172033] transition-colors">Dashboard</a>
            <a href="#roles" className="hover:text-[#172033] transition-colors">Role Portals</a>
            <a href="#architecture" className="hover:text-[#172033] transition-colors">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStart}
              className="text-xs font-medium text-[#172033] hover:text-[#4F46E5] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={handleRegister}
              className="text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto border-b border-[#E2E8F0]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F46E5]"></span>
              <span>AI-POWERED CAMPUS INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#172033] leading-[1.15]">
              Turn Campus Events Into <br />
              <span className="text-[#4F46E5]">Intelligent Decisions.</span>
            </h1>

            <p className="text-sm md:text-base text-[#64748B] leading-relaxed max-w-xl">
              EventIntel AI is an enterprise-grade university event management and intelligence platform. Combining machine learning demand forecasting, NLP feedback sentiment, and student clustering to elevate institutional operations.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Explore EventIntel</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={handleRegister}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172033] text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Create Account</span>
              </button>
            </div>

            {/* Micro Institutional Metric Pills */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E2E8F0]">
              <div>
                <div className="text-lg font-bold text-[#172033]">
                  <CountUp end={225} suffix="+" />
                </div>
                <div className="text-xs text-[#64748B]">Verified Students</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#16A34A]">
                  <CountUp end={100} suffix="%" />
                </div>
                <div className="text-xs text-[#64748B]">Attendance Turnout</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#4F46E5]">
                  <CountUp end={10} suffix=" Modules" />
                </div>
                <div className="text-xs text-[#64748B]">Active AI Systems</div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Light Dashboard Preview */}
          <div className="lg:col-span-6">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-5">
              {/* Dashboard Preview Header */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></div>
                  <span className="text-xs font-bold text-[#172033]">Institution Telemetry Overview</span>
                </div>
                <span className="text-[11px] font-semibold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#C7D2FE]">
                  Active Academic Term
                </span>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] font-medium block">Total Turnout</span>
                  <div className="text-lg font-bold text-[#172033] mt-0.5">225 / 225</div>
                  <span className="text-[10px] text-[#16A34A] font-semibold">100% Conversion</span>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] font-medium block">Demand Index</span>
                  <div className="text-lg font-bold text-[#4F46E5] mt-0.5">92.4%</div>
                  <span className="text-[10px] text-[#4F46E5] font-semibold">5 High Demand</span>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] text-[#64748B] font-medium block">Satisfaction</span>
                  <div className="text-lg font-bold text-[#D97706] mt-0.5">5.0 ★</div>
                  <span className="text-[10px] text-[#16A34A] font-semibold">100% Positive</span>
                </div>
              </div>

              {/* Mini Area Chart */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#172033]">Registration & Attendance Volume</span>
                  <span className="text-[11px] text-[#64748B]">Weekly Telemetry</span>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="heroReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="registrations" stroke="#4F46E5" strokeWidth={1.5} fill="url(#heroReg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insight Snippet */}
              <div className="p-3 bg-[#F8FAFC] border-l-2 border-[#4F46E5] rounded-r-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#172033] flex items-center gap-1">
                    <Sparkles size={12} className="text-[#4F46E5]" /> AI Recommendation
                  </span>
                  <span className="text-[10px] text-[#16A34A] font-bold">CONFIDENCE: HIGH</span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Gen AI Workshop projected to exceed capacity (90 predicted vs 100 max). Consider expanding venue allocation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 AI Modules Section */}
      <section id="modules" className="py-20 px-6 max-w-7xl mx-auto border-b border-[#E2E8F0]">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">Enterprise Machine Learning</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033]">
            10 Intelligent Systems. One Unified Platform.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Every AI module is designed for institutional rigor, reproducibility, and zero hallucinated metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {aiModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.id} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs hover:shadow-md hover:border-[#CBD5E1] transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <span className="text-[11px] font-mono text-[#94A3B8] font-semibold">{mod.id}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#172033]">{mod.title}</h3>
                  <span className="text-[10px] font-medium text-[#4F46E5] block mt-0.5">{mod.algorithm}</span>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  {mod.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role Portals Section */}
      <section id="roles" className="py-20 px-6 max-w-7xl mx-auto border-b border-[#E2E8F0]">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">Access Control & Roles</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033]">
            Tailored Experiences for Every Stakeholder
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Role-based authorization enforces privacy while delivering targeted intelligence to students, organizers, and administration.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[#FFFFFF] p-1 rounded-xl border border-[#E2E8F0] shadow-xs">
            {[
              { id: 'student', label: 'Student Portal' },
              { id: 'organizer', label: 'Event Organizer' },
              { id: 'admin', label: 'Dean / Administrator' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveRoleTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeRoleTab === tab.id 
                    ? 'bg-[#EEF2FF] text-[#4F46E5]' 
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
          {activeRoleTab === 'student' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                  Student Experience
                </span>
                <h3 className="text-xl font-bold text-[#172033]">Discovery, Recommendations & RAG AI Assistant</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Students browse university workshops, receive TF-IDF driven recommendations matching their interests, register with 1-click, and ask questions to the RAG AI Assistant with instant verified answers.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Personalized recommendations tailored to department and interests</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Conversational event assistant grounded strictly on campus database</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Digital certificates automatically generated upon QR attendance check-in</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#172033] border-b border-[#E2E8F0] pb-2">
                  <span>Recommended for You</span>
                  <span className="text-[#4F46E5]">96% Match</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg">
                    <h4 className="text-xs font-bold text-[#172033]">Generative AI & LLM Workshop</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Aug 20 • Seminar Hall 1 • 2 hours</p>
                  </div>
                  <div className="p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg">
                    <h4 className="text-xs font-bold text-[#172033]">Full-Stack Web Dev Hackathon</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Sep 15 • CSE Innovation Lab</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === 'organizer' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                  Organizer Experience
                </span>
                <h3 className="text-xl font-bold text-[#172033]">Command Center, Demand Modeling & AI Posters</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Faculty and club organizers manage scheduled events, review attendance trends, predict student demand before venue confirmation, and generate academic posters via natural language prompts.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Predictive registration modeling to optimize seating allocations</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Real-time feedback sentiment analysis with topic categorization</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>One-click AI event generator & poster designer with downloadable assets</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#172033] border-b border-[#E2E8F0] pb-2">
                  <span>Organizer Telemetry</span>
                  <span className="text-[#16A34A]">All Healthy</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#64748B]">My Events</span>
                    <div className="text-sm font-bold text-[#172033]">15 Active</div>
                  </div>
                  <div className="p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#64748B]">Registrations</span>
                    <div className="text-sm font-bold text-[#4F46E5]">225 Verified</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                  Administrative Governance
                </span>
                <h3 className="text-xl font-bold text-[#172033]">Institution Macro Analytics & Early Warnings</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Deans and campus administrators monitor institution-wide participation, departmental engagement benchmarks, K-Means student behavior clusters, and early warnings on low turnout risks.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Campus-wide student behavior segmentation (Highly Active vs Low Engagement)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Automated early warning scanners for capacity and attendance conversion</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#172033]">
                    <CheckCircle2 size={15} className="text-[#16A34A]" />
                    <span>Actionable executive summaries and resource planning recommendations</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#172033] border-b border-[#E2E8F0] pb-2">
                  <span>Student Behavior Clusters</span>
                  <span className="text-[#4F46E5]">K-Means (k=3)</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-[#16A34A]">Highly Active</span>
                    <span className="font-bold">45 Students</span>
                  </div>
                  <div className="p-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-[#64748B]">Low Engagement</span>
                    <span className="font-bold">25 Students</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Architecture & Tech Stack Section */}
      <section id="architecture" className="py-20 px-6 max-w-7xl mx-auto border-b border-[#E2E8F0]">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">Engineering Standards</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033]">
            Enterprise-Grade Full-Stack Architecture
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Built with strict separation of concerns, persistent PostgreSQL storage, and Python ML inference microservices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
            <div className="text-xs font-bold text-[#4F46E5] uppercase">Frontend Layer</div>
            <h4 className="text-sm font-semibold text-[#172033]">React + Vite + Recharts</h4>
            <p className="text-xs text-[#64748B]">Modular SPA with lightweight responsive UI, client routing, and data visualization.</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
            <div className="text-xs font-bold text-[#4F46E5] uppercase">Gateway API</div>
            <h4 className="text-sm font-semibold text-[#172033]">Node.js + Express + Prisma</h4>
            <p className="text-xs text-[#64748B]">Role-based JWT authentication, route proxying, and ORM database management.</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
            <div className="text-xs font-bold text-[#4F46E5] uppercase">AI Microservice</div>
            <h4 className="text-sm font-semibold text-[#172033]">Python + FastAPI + Scikit-Learn</h4>
            <p className="text-xs text-[#64748B]">High-throughput inference for K-Means, Ridge regressions, and Transformers.</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
            <div className="text-xs font-bold text-[#4F46E5] uppercase">Database Layer</div>
            <h4 className="text-sm font-semibold text-[#172033]">PostgreSQL + pgvector</h4>
            <p className="text-xs text-[#64748B]">ACID transaction guarantees with vector embeddings for cosine similarity search.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#172033]">
          Ready to Modernize Your Campus Event Operations?
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto">
          Experience the power of machine learning, automated sentiment analysis, and intelligent demand prediction today.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Launch EventIntel Portal
          </button>
          <button
            onClick={handleRegister}
            className="px-6 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172033] text-xs font-semibold transition-colors cursor-pointer"
          >
            Create Profile
          </button>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="border-t border-[#E2E8F0] bg-[#FFFFFF] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold">
              EI
            </div>
            <span className="font-semibold text-[#172033]">EventIntel AI</span>
            <span>— Enterprise Campus Intelligence</span>
          </div>
          <div>
            © {new Date().getFullYear()} EventIntel Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
