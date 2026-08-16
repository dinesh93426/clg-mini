import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Sparkles, BarChart3, Users, Compass, 
  CalendarRange, CheckCircle2, ArrowRight, ShieldAlert, Cpu,
  TrendingUp, MessageSquare, ShieldCheck, Zap, Activity, Clock,
  ArrowUpRight, ChevronRight, Play, Quote, Check, Info, AlertTriangle,
  Lightbulb, Database, Network, Eye, RefreshCw, Layers
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
    <span ref={elementRef} className="font-display">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Canvas Particle Network Background for subtle, premium data flowing visual
const ParticleNetwork = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 1.2 + 0.4,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Fine grid background
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw and update particles
      ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounce boundaries
        if (p.x < 0 || p.x > width) p.vx = -p.vx;
        if (p.y < 0 || p.y > height) p.vy = -p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with thin lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none -z-10" />;
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('engagement');
  const [simulatedRecommendation, setSimulatedRecommendation] = useState(null);
  const [processStep, setProcessStep] = useState(0);

  // Set page title for SEO & aesthetics
  useEffect(() => {
    document.title = "EventIntel AI | Enterprise Campus Event Intelligence Platform";
  }, []);

  // Handle scroll trigger for navbar transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cycle through the recommendation process flowchart automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessStep((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  // Mock data for Recharts
  const heroEngagementData = [
    { week: 'W1', score: 62 },
    { week: 'W2', score: 68 },
    { week: 'W3', score: 74 },
    { week: 'W4', score: 87 },
  ];

  const engagementTrend = [
    { name: 'Mon', engagement: 62, prediction: 65 },
    { name: 'Tue', engagement: 68, prediction: 70 },
    { name: 'Wed', engagement: 71, prediction: 72 },
    { name: 'Thu', engagement: 80, prediction: 78 },
    { name: 'Fri', engagement: 87, prediction: 85 },
    { name: 'Sat', engagement: 83, prediction: 88 },
    { name: 'Sun', engagement: 89, prediction: 90 },
  ];

  const eventPerformanceData = [
    { name: 'Hackathon', Attendance: 92, Capacity: 150 },
    { name: 'Tech Sym.', Attendance: 78, Capacity: 210 },
    { name: 'Cultural Fest', Attendance: 94, Capacity: 480 },
    { name: 'Sports Meet', Attendance: 68, Capacity: 300 },
  ];

  const sentimentData = [
    { name: 'Positive', value: 84 },
    { name: 'Neutral', value: 11 },
    { name: 'Negative', value: 5 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="bg-[#050814] text-white min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden font-sans">
      {/* Sticky Data Grid Background */}
      <ParticleNetwork />

      {/* Radial lighting highlights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-20"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none -z-20"></div>
      <div className="absolute bottom-1/4 left-10 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[140px] pointer-events-none -z-20"></div>

      {/* Premium Sticky Navigation Bar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-[#050814]/90 backdrop-blur-md border-b border-white/5 py-4 shadow-lg shadow-black/20' 
            : 'bg-transparent py-6 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              EventIntel <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">AI</span>
            </span>
          </div>
          
          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#platform" className="hover:text-white transition-colors duration-200">Platform</a>
            <a href="#ai-intelligence" className="hover:text-white transition-colors duration-200">AI Intelligence</a>
            <a href="#analytics" className="hover:text-white transition-colors duration-200">Analytics</a>
            <a href="#recommendations" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#testimonials" className="hover:text-white transition-colors duration-200">About</a>
          </div>
          
          {/* Right Action buttons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleStart}
              className="text-sm font-semibold text-slate-350 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={handleRegister}
              className="px-5 py-2.5 text-xs font-bold bg-white text-[#050814] rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-white/5"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Two-Column Premium SaaS Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
              <Sparkles size={12} className="text-violet-400 animate-pulse" />
              <span>AI-POWERED CAMPUS INTELLIGENCE</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Turn Campus Events <br />
              Into <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">Intelligent Decisions.</span>
            </h1>

            {/* Supporting text */}
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              EventIntel AI is an AI-powered campus event intelligence platform. It analyzes attendance, student behavior, feedback, and sentiment to help universities predict demand, optimize resources, and design smarter campus experiences.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore EventIntel</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#analytics"
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>See Intelligence Demo</span>
              </a>
            </div>

            {/* Trust statement */}
            <div className="pt-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck size={14} className="text-indigo-550" />
              <span>Built for modern universities • Powered by AI</span>
            </div>
          </div>

          {/* Hero Right: Live AI Intelligence Dashboard Visualization */}
          <div className="lg:col-span-6 relative w-full flex justify-center">
            
            {/* Core Glow Background Behind Dashboard */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10" />

            {/* Simulated Live Application Interface Container */}
            <div className="w-full max-w-[480px] sm:max-w-[540px] bg-slate-950/80 border border-white/5 p-4 sm:p-5 rounded-2xl shadow-2xl relative backdrop-blur-md">
              
              {/* Fake OS Window header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  EVENTINTEL // CAM-026
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              {/* Main Dashboard Card Contents */}
              <div className="space-y-4 text-left">
                {/* Dashboard Title & Quick Stats */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campus Intelligence Overview</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-display text-white">87%</span>
                      <span className="text-[10px] font-semibold text-slate-355">Engagement Index</span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    +14.8% this month
                  </div>
                </div>

                {/* Engagement Trend Chart */}
                <div className="h-28 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={heroEngagementData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHeroEngage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0d18', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorHeroEngage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Sub statistics or micro features inside panel */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Event Success Rate</span>
                    <span className="text-sm font-bold block mt-0.5 text-indigo-300">92.4% Probability</span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">AI Status</span>
                    <span className="text-sm font-bold block mt-0.5 text-cyan-300">Active Monitoring</span>
                  </div>
                </div>
              </div>

              {/* Smaller Floating Cards around it - absolutely positioned, hidden on mobile to avoid overflow */}
              
              {/* Floating Card 1: AI Prediction */}
              <div className="absolute -top-7 -left-10 bg-slate-900/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md hidden sm:flex items-center gap-3 animate-bounce-slow">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Activity size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">AI Attendance Predictor</span>
                  <span className="text-xs font-bold text-white">92% probability index</span>
                </div>
              </div>

              {/* Floating Card 2: Sentiment */}
              <div className="absolute -bottom-8 -right-8 bg-slate-900/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <MessageSquare size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">Student Sentiment</span>
                  <span className="text-xs font-bold text-emerald-400">Positive • 84% score</span>
                </div>
              </div>

              {/* Floating Card 3: AI Recommendation */}
              <div className="absolute -bottom-10 -left-6 bg-slate-900/95 border border-purple-500/30 p-3 rounded-xl shadow-xl backdrop-blur-md hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 animate-pulse">
                  <Sparkles size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-purple-400 block uppercase">AI Recommendation</span>
                  <span className="text-xs font-semibold text-slate-200">Scale TechFest to Venue C</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Style definitions for small floating bounce effect and animated lines */}
      <style>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 3.5s ease-in-out infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animate-dash {
          animation: dash 2s linear infinite;
        }
      `}</style>

      {/* Metrics / Trust Section */}
      <section className="bg-white/[0.01] border-y border-white/5 py-12 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            {/* Stat 1 */}
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-display bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                <CountUp end={50000} suffix="+" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Student Interactions</p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-display bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                <CountUp end={2400} suffix="+" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Events Analyzed</p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-display bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                <CountUp end={94} suffix="%" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Prediction Accuracy</p>
            </div>

            {/* Stat 4 */}
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-display bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                <CountUp end={38} suffix="%" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Better Engagement</p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Answers / Value Grid Section (10 Seconds UX requirement) */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center border-b border-white/5">
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-bold font-display text-white">Platform Core Architecture</h2>
          <p className="text-sm text-slate-400 mt-2">Get to know the event intelligence system in ten seconds.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Card 1: What */}
          <div className="p-6 bg-slate-900/20 border border-white/5 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">01 / WHAT IS IT?</span>
            <h4 className="text-lg font-bold font-display text-white">AI-Powered Event Platform</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              An enterprise-grade intelligence platform engineered to connect campus administration, event coordinators, and students onto one unified operating stack.
            </p>
          </div>
          {/* Card 2: Does */}
          <div className="p-6 bg-slate-900/20 border border-white/5 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">02 / WHAT DOES IT DO?</span>
            <h4 className="text-lg font-bold font-display text-white">Deep Campus Analytics</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Aggregates event attendance data, registration velocities, feedback sentiments, and student profiles to generate accurate forecasts and sentiment intelligence.
            </p>
          </div>
          {/* Card 3: Why */}
          <div className="p-6 bg-slate-900/20 border border-white/5 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">03 / WHY USE IT?</span>
            <h4 className="text-lg font-bold font-display text-white">Predictive Optimization</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enables student affairs to make data-driven decisions on scheduling, space distribution, food catering, and venue capacities before any event begins.
            </p>
          </div>
        </div>
      </section>

      {/* AI Intelligence Section */}
      <section id="ai-intelligence" className="max-w-7xl mx-auto px-6 py-20 lg:py-24 text-center">
        
        {/* Section Headers */}
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-indigo-455 uppercase tracking-widest">THE INTELLIGENCE LAYER</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight">
            One Intelligence Layer. <br />Every Event Decision.
          </h2>
          <p className="text-base sm:text-lg text-slate-450 max-w-xl mx-auto">
            EventIntel AI connects your event data, student behavior, and feedback into one intelligent decision-making layer.
          </p>
        </div>

        {/* Feature Cards Grid (4 Features) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          
          {/* Card 1: Predict */}
          <div className="p-6 bg-[#090d18] border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-all duration-350 flex flex-col justify-between group hover:-translate-y-1">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-550/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <Clock size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">Predict</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Predict attendance, student engagement levels, and overall campus event demand before the event begins.
              </p>
            </div>
            
            {/* Custom Micro visualization: Mini Forecast Chart */}
            <div className="pt-4 border-t border-white/5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Predictive Confidence</span>
              <svg className="w-full h-12 stroke-indigo-500/70 fill-none" viewBox="0 0 100 30">
                {/* Dotted prediction confidence line */}
                <path d="M 0 25 L 20 20 L 40 22 L 60 15 L 80 12 L 100 5" strokeDasharray="2 2" stroke="rgba(168,85,247,0.5)" strokeWidth="1" />
                {/* Real-time incoming forecast trend line */}
                <path d="M 0 25 L 20 18 L 40 23 L 60 14" strokeWidth="1.8" />
                <circle cx="60" cy="14" r="2" className="fill-indigo-500" />
              </svg>
            </div>
          </div>

          {/* Card 2: Understand */}
          <div className="p-6 bg-[#090d18] border border-white/5 rounded-2xl hover:border-violet-500/20 transition-all duration-350 flex flex-col justify-between group hover:-translate-y-1">
            <div>
              <div className="w-10 h-10 rounded-lg bg-violet-555/10 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-105 transition-transform">
                <Users size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">Understand</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Analyze student behavior, department distribution, engagement velocity, and event participation patterns.
              </p>
            </div>
            
            {/* Custom Micro visualization: Segment bars */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Engagement Segments</span>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Engineering</span>
                  <span className="text-cyan-400">76%</span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-550 rounded-full" style={{ width: '76%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Business</span>
                  <span className="text-violet-400">54%</span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-550 rounded-full" style={{ width: '54%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Recommend */}
          <div className="p-6 bg-[#090d18] border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all duration-350 flex flex-col justify-between group hover:-translate-y-1">
            <div>
              <div className="w-10 h-10 rounded-lg bg-cyan-555/10 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <Sparkles size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">Recommend</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Generate AI-powered recommendations for event planning, resource allocations, and coordinate schedules.
              </p>
            </div>
            
            {/* Custom Micro visualization: Query Prompt box */}
            <div className="pt-4 border-t border-white/5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Active AI Agent Actions</span>
              <div className="text-[9px] space-y-1 bg-[#050814] border border-white/5 p-2 rounded-lg font-mono text-slate-450">
                <div className="text-cyan-400 flex items-center gap-1">
                  <Sparkles size={8} /> <span>Optimize: TechFest Capacity</span>
                </div>
                <div>Action: Recommend Room 204 (+24%)</div>
              </div>
            </div>
          </div>

          {/* Card 4: Improve */}
          <div className="p-6 bg-[#090d18] border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-all duration-350 flex flex-col justify-between group hover:-translate-y-1">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-555/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Activity size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">Improve</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Turn post-event survey data and attendance logs into actionable recommendations for next-semester events.
              </p>
            </div>
            
            {/* Custom Micro visualization: Feedback avatars & rate */}
            <div className="pt-4 border-t border-white/5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Post-Event Sentiment</span>
              <div className="flex gap-2 items-center">
                <div className="flex -space-x-1.5">
                  <div className="w-5.5 h-5.5 rounded-full bg-indigo-650 border border-slate-900 flex items-center justify-center text-[7px] font-bold font-mono">EN</div>
                  <div className="w-5.5 h-5.5 rounded-full bg-violet-655 border border-slate-900 flex items-center justify-center text-[7px] font-bold font-mono">SA</div>
                  <div className="w-5.5 h-5.5 rounded-full bg-cyan-650 border border-slate-900 flex items-center justify-center text-[7px] font-bold font-mono">CH</div>
                </div>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <Check size={8} className="stroke-[3]" /> 94% positive rating
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Analytics Showcase Section */}
      <section id="analytics" className="max-w-7xl mx-auto px-6 py-20 lg:py-24 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Showcase Left: Headers & Navigation */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">LIVE DATA SIMULATOR</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
                See What Your Campus Data Is Telling You.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Click the categories below to interact with the simulated real-time intelligence dashboard. See how data is visualized and recommendations are compiled.
              </p>
            </div>

            {/* Selector list for dashboard tab */}
            <div className="space-y-2 pt-2">
              <button 
                onClick={() => setActiveTab('engagement')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  activeTab === 'engagement' 
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' 
                    : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity size={16} className={activeTab === 'engagement' ? 'text-indigo-400' : 'text-slate-500'} />
                  <span className="text-sm font-semibold">Engagement Overview</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <button 
                onClick={() => setActiveTab('performance')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  activeTab === 'performance' 
                    ? 'bg-violet-600/10 border-violet-500/30 text-white shadow-lg' 
                    : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={16} className={activeTab === 'performance' ? 'text-violet-400' : 'text-slate-500'} />
                  <span className="text-sm font-semibold">Event Performance</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <button 
                onClick={() => setActiveTab('sentiment')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  activeTab === 'sentiment' 
                    ? 'bg-cyan-600/10 border-cyan-500/30 text-white shadow-lg' 
                    : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className={activeTab === 'sentiment' ? 'text-cyan-400' : 'text-slate-500'} />
                  <span className="text-sm font-semibold">Student Sentiment</span>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Showcase Right: High-Fidelity Interactive Dashboard Box */}
          <div className="lg:col-span-8 bg-[#090d18] border border-white/5 p-5 rounded-2xl shadow-xl relative text-left">
            
            {/* Header of simulated dashboard */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                <span className="text-xs font-bold text-slate-400 font-mono">DASHBOARD // ANALYTICS_STREAM</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                <span>LIVE UPDATING</span>
              </div>
            </div>

            {/* Grid for main chart and secondary information panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Dynamic Chart Area (2 Columns) */}
              <div className="md:col-span-2 space-y-4">
                
                {/* Active view header */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {activeTab === 'engagement' && "Engagement index trend (real vs predictive)"}
                    {activeTab === 'performance' && "Event performance comparisons"}
                    {activeTab === 'sentiment' && "Aggregate sentiment scans (survey summaries)"}
                  </h4>
                  <div className="text-xl font-bold text-white mt-1">
                    {activeTab === 'engagement' && "87% Peak Engagement Score"}
                    {activeTab === 'performance' && "Hackathon and Cultural Fest Leading"}
                    {activeTab === 'sentiment' && "84% Positive Student Sentiment Index"}
                  </div>
                </div>

                {/* Render the Active Tab Chart */}
                <div className="h-56 w-full mt-4 bg-white/[0.01] border border-white/5 rounded-xl p-3 flex items-center justify-center">
                  
                  {activeTab === 'engagement' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={engagementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEngTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPredTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0d18', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorEngTrend)" name="Engagement" />
                        <Area type="monotone" dataKey="prediction" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorPredTrend)" name="Predictive" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {activeTab === 'performance' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={eventPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0d18', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Bar dataKey="Attendance" radius={[4, 4, 0, 0]} name="Attendance Rate %">
                          {eventPerformanceData.map((entry, index) => {
                            const colors = ['#6366f1', '#a855f7', '#06b6d4', '#10b981'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {activeTab === 'sentiment' && (
                    <div className="flex flex-col sm:flex-row items-center justify-around w-full gap-4">
                      {/* Left: Recharts Pie Chart */}
                      <div className="w-36 h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sentimentData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={55}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {sentimentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0a0d18', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Right: Custom text-based indicator grid */}
                      <div className="space-y-2 w-full max-w-[200px]">
                        {sentimentData.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                              <span className="text-slate-400 font-semibold">{item.name}</span>
                            </div>
                            <span className="font-bold text-white">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* AI Insight Side Panel (1 Column) */}
              <div className="bg-[#0e1324] border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Sparkles size={14} className="animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Insight Panel</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-200 leading-snug">Registration Overload Warning</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    "Registration velocity for the upcoming Hackathon is 23% higher than historical patterns. AI predicts seating capacity threshold will be reached in 48 hours."
                  </p>
                </div>

                {/* Simulated Interaction Button */}
                <div>
                  <button 
                    onClick={() => setSimulatedRecommendation({
                      event: "Smart Campus Hackathon 2026",
                      confidence: "94% Match Accuracy",
                      reason: "Registration pace indicates attendance overloads.",
                      recommendation: "Move event from IT Lab-A to Main Auditorium B and expand seating limit by 18%."
                    })}
                    className="w-full py-2.5 text-[10px] font-bold bg-purple-650 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-650/10"
                  >
                    <span>View recommendation →</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Interactive Popup Overlay on recommendation click */}
            <AnimatePresence>
              {simulatedRecommendation && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-slate-955/95 border border-purple-550/20 rounded-2xl p-6 flex flex-col justify-between z-20 backdrop-blur-md"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                        <Sparkles size={16} />
                        <span className="text-xs font-display">AI Action Plan Activated</span>
                      </div>
                      <button 
                        onClick={() => setSimulatedRecommendation(null)}
                        className="text-xs text-slate-450 hover:text-white border border-white/5 px-2 py-0.5 rounded bg-white/[0.02] cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-505 uppercase tracking-widest block font-bold">Targeted Event</span>
                        <span className="text-xs font-bold text-white block mt-0.5">{simulatedRecommendation.event}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-505 uppercase tracking-widest block font-bold">AI Certainty Index</span>
                        <span className="text-xs font-bold text-emerald-400 block mt-0.5">{simulatedRecommendation.confidence}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-505 uppercase tracking-widest block font-bold">Risk Assessment</span>
                      <p className="text-xs text-slate-350 mt-1">{simulatedRecommendation.reason}</p>
                    </div>

                    <div className="p-3.5 bg-purple-555/5 border border-purple-550/20 rounded-xl">
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest block">Recommended Action</span>
                      <p className="text-xs text-slate-200 font-semibold mt-1.5 leading-relaxed">
                        {simulatedRecommendation.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                    <button 
                      onClick={() => setSimulatedRecommendation(null)}
                      className="px-4 py-2 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button 
                      onClick={handleStart}
                      className="px-4 py-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      Apply Action
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </section>

      {/* AI Recommendation Process Flow Section */}
      <section id="recommendations" className="max-w-7xl mx-auto px-6 py-20 lg:py-24 border-t border-white/5 text-center">
        
        {/* Headers */}
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">INTELLIGENT PIPELINE</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
            From Raw Event Data to Actionable Intelligence.
          </h2>
          <p className="text-sm text-slate-405 max-w-xl mx-auto">
            See how the platform ingests raw university database activity and outputs optimal organizing blueprints.
          </p>
        </div>

        {/* Process Flow Diagram */}
        <div className="bg-[#090d18] border border-white/5 rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto relative overflow-hidden">
          
          {/* Animated Connecting Line behind steps (Only desktop) */}
          <div className="absolute top-[88px] left-[10%] right-[10%] h-[2px] hidden md:block z-0">
            <svg className="w-full h-full">
              <line 
                x1="0" 
                y1="1" 
                x2="100%" 
                y2="1" 
                stroke="rgba(99, 102, 241, 0.2)" 
                strokeWidth="2" 
                strokeDasharray="6 6"
                className="animate-dash"
              />
            </svg>
          </div>

          {/* Stepper nodes */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 relative z-10">
            
            {/* Step 1 */}
            <div className="space-y-4">
              <div 
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border transition-all duration-300 ${
                  processStep === 0 
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10 scale-110' 
                    : 'bg-slate-905 border-white/5 text-slate-500'
                }`}
              >
                <Database size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">STAGE 01</span>
                <h4 className="text-xs font-bold text-white mt-1">EVENT DATA</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] mx-auto leading-normal">
                  Ingests registrations, past history & feedback.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div 
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border transition-all duration-300 ${
                  processStep === 1 
                    ? 'bg-violet-600/20 border-violet-500 text-violet-400 shadow-lg shadow-violet-500/10 scale-110' 
                    : 'bg-slate-905 border-white/5 text-slate-500'
                }`}
              >
                <Cpu size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">STAGE 02</span>
                <h4 className="text-xs font-bold text-white mt-1">AI ANALYSIS</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] mx-auto leading-normal">
                  Processes demographic data & pace scales.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div 
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border transition-all duration-300 ${
                  processStep === 2 
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/10 scale-110' 
                    : 'bg-slate-905 border-white/5 text-slate-500'
                }`}
              >
                <Network size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">STAGE 03</span>
                <h4 className="text-xs font-bold text-white mt-1">PATTERN DETECTION</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] mx-auto leading-normal">
                  Correlates sentiments and spatial loads.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-4">
              <div 
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border transition-all duration-300 ${
                  processStep === 3 
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10 scale-110' 
                    : 'bg-slate-905 border-white/5 text-slate-500'
                }`}
              >
                <Lightbulb size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">STAGE 04</span>
                <h4 className="text-xs font-bold text-white mt-1">RECOMMENDATION</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] mx-auto leading-normal">
                  Generates optimization blueprints.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-4">
              <div 
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border transition-all duration-300 ${
                  processStep === 4 
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10 scale-110' 
                    : 'bg-slate-905 border-white/5 text-slate-500'
                }`}
              >
                <CheckCircle2 size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">STAGE 05</span>
                <h4 className="text-xs font-bold text-white mt-1">BETTER EVENT</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] mx-auto leading-normal">
                  Optimized venue settings & resources.
                </p>
              </div>
            </div>

          </div>

          {/* Simulated Active Output panel beneath */}
          <div className="mt-10 p-5 bg-[#050814] border border-white/5 rounded-xl text-left max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw size={12} className="text-indigo-400 animate-spin-slow" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">PIPELINE MONITOR</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">STAGE: {processStep + 1} / 5</span>
            </div>
            
            <div className="space-y-2 text-xs">
              {processStep === 0 && (
                <div className="text-slate-350">
                  <span className="text-indigo-400 font-bold">{"[Ingesting] "}</span> 
                  Registrations for "AI Hackathon" (180 entries), attendance stats from 2025, and student department tags loaded.
                </div>
              )}
              {processStep === 1 && (
                <div className="text-slate-355">
                  <span className="text-violet-400 font-bold">{"[Analyzing] "}</span> 
                  Calculating projection velocity. Hackathon registrations pace is 23% faster than standard averages.
                </div>
              )}
              {processStep === 2 && (
                <div className="text-slate-355">
                  <span className="text-purple-400 font-bold">{"[Detecting] "}</span> 
                  Space limit triggers alert. Venue capacity for IT Lab-A is 150. Forecasted attendance rate is 92% (165 students).
                </div>
              )}
              {processStep === 3 && (
                <div className="text-slate-355">
                  <span className="text-cyan-400 font-bold">{"[Compiling] "}</span> 
                  Generating suggestion: Move the event to Auditorium B and scale catering by +18% to support student surplus.
                </div>
              )}
              {processStep === 4 && (
                <div className="text-slate-355">
                  <span className="text-emerald-400 font-bold">{"[Finalized] "}</span> 
                  Recommendation applied. Event successfully conducted with 165 attendees, zero seat deficits, and 94% positive sentiment.
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Event Intelligence Cards Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-24 border-t border-white/5">
        
        {/* Headers */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">LIVE CATALOG PREVIEW</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
            Comprehensive Event Intelligence.
          </h2>
          <p className="text-sm text-slate-450 max-w-xl mx-auto">
            Take a look at active campus events integrated with live prediction vectors.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Hackathon */}
          <div className="bg-[#090d18] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-indigo-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">TECHNOLOGY</span>
                <h4 className="text-base font-bold font-display text-white mt-1">AI Hackathon 2026</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Optimized
              </span>
            </div>
            
            <div className="space-y-3.5 pt-2 border-t border-white/5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-550">Attendance Prediction</span>
                <span className="font-bold text-white">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550">Expected Engagement</span>
                <span className="font-bold text-white">88%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-555">Student Sentiment</span>
                <span className="font-bold text-emerald-400">Positive</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Capacity Level</span>
                  <span>150 / 180 seats</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-550 rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Tech Symposium */}
          <div className="bg-[#090d18] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-violet-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">ACADEMICS</span>
                <h4 className="text-base font-bold font-display text-white mt-1">Tech Symposium</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                Reviewing
              </span>
            </div>
            
            <div className="space-y-3.5 pt-2 border-t border-white/5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-555">Attendance Prediction</span>
                <span className="font-bold text-white">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-555">Expected Engagement</span>
                <span className="font-bold text-white">72%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-555">Student Sentiment</span>
                <span className="font-bold text-amber-400">Neutral</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Capacity Level</span>
                  <span>210 / 250 seats</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-555 rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Cultural Fest */}
          <div className="bg-[#090d18] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-cyan-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">ENTERTAINMENT</span>
                <h4 className="text-base font-bold font-display text-white mt-1">Cultural Fest</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                Capacity Warning
              </span>
            </div>
            
            <div className="space-y-3.5 pt-2 border-t border-white/5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-555">Attendance Prediction</span>
                <span className="font-bold text-white">96%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-555">Expected Engagement</span>
                <span className="font-bold text-white">91%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-555">Student Sentiment</span>
                <span className="font-bold text-emerald-400">Positive</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Capacity Level</span>
                  <span>480 / 500 seats</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full animate-pulse" style={{ width: '96%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Innovation Summit */}
          <div className="bg-[#090d18] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-indigo-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">BUSINESS</span>
                <h4 className="text-base font-bold font-display text-white mt-1">Innovation Summit</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Optimized
              </span>
            </div>
            
            <div className="space-y-3.5 pt-2 border-t border-white/5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-555">Attendance Prediction</span>
                <span className="font-bold text-white">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-555">Expected Engagement</span>
                <span className="font-bold text-white">80%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-555">Student Sentiment</span>
                <span className="font-bold text-emerald-400">Positive</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Capacity Level</span>
                  <span>95 / 120 seats</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-550 rounded-full" style={{ width: '79%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Testimonials / University Trust Section */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20 lg:py-24 border-t border-white/5">
        
        {/* Headers */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">TESTIMONIALS</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
            Built for Data-Driven Campuses.
          </h2>
          <p className="text-sm text-slate-450 max-w-xl mx-auto">
            See how campus directors and student body leaders use EventIntel AI to organize successful events.
          </p>
        </div>

        {/* Quotes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Card 1 */}
          <div className="p-6 bg-slate-900/10 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4 relative">
            <Quote size={24} className="text-indigo-550/20 absolute top-4 right-4" />
            <p className="text-xs text-slate-300 leading-relaxed italic z-10">
              "EventIntel AI helped us optimize seating and schedule timings for our annual engineering symposium. Real-time predictions kept us from running out of venue space."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-indigo-650 flex items-center justify-center font-bold text-xs font-mono">
                AT
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Dr. Aris Thorne</h5>
                <span className="text-[10px] text-slate-500">Director of Student Affairs, Westwood University</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-slate-900/10 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4 relative">
            <Quote size={24} className="text-violet-550/20 absolute top-4 right-4" />
            <p className="text-xs text-slate-300 leading-relaxed italic z-10">
              "The post-event sentiment tools gave us direct, honest feedback that we actually used to improve food vendors and spatial layouts. Highly recommend to student organizers."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-violet-650 flex items-center justify-center font-bold text-xs font-mono">
                ML
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Maya Lin</h5>
                <span className="text-[10px] text-slate-500">Student Council President, Apex Institute</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-slate-900/10 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4 relative">
            <Quote size={24} className="text-cyan-550/20 absolute top-4 right-4" />
            <p className="text-xs text-slate-305 leading-relaxed italic z-10">
              "Predicting registrations ahead of time allowed us to coordinate facilities, security, and allocate budgets efficiently. It has become our campus operations blueprint."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-cyan-650 flex items-center justify-center font-bold text-xs font-mono">
                MV
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Marcus Vance</h5>
                <span className="text-[10px] text-slate-500">Campus Operations Coordinator</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Premium Final CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 lg:py-20 text-center">
        <div className="bg-gradient-to-tr from-indigo-955/40 via-slate-955/80 to-indigo-955/25 border border-indigo-500/10 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          
          {/* Subtle design gradient dot in background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
          
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight text-white">
              Make Every Campus Event Smarter.
            </h2>
            <p className="text-sm sm:text-base text-slate-405 leading-relaxed">
              Use AI to understand your students, optimize your events, and make better decisions before, during, and after every event. Join data-driven campuses today.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleRegister}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold bg-white text-[#050814] hover:bg-slate-200 rounded-xl transition-all shadow-lg shadow-white/5 cursor-pointer"
              >
                Get Started →
              </button>
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Explore Platform
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-white/5 bg-[#03060f]/60 py-16 text-slate-550 text-left">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            
            {/* Column 1: Info */}
            <div className="space-y-4 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <BrainCircuit size={16} className="text-white" />
                </div>
                <span className="font-display font-bold text-lg text-white">
                  EventIntel <span className="text-indigo-400">AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-450 leading-relaxed max-w-[200px]">
                Intelligence for smarter, data-driven campus event experiences.
              </p>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Product</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-450">
                <li><a href="#platform" className="hover:text-white transition-colors">Platform Overview</a></li>
                <li><a href="#ai-intelligence" className="hover:text-white transition-colors">AI Intelligence</a></li>
                <li><a href="#analytics" className="hover:text-white transition-colors">Analytics Panel</a></li>
                <li><a href="#recommendations" className="hover:text-white transition-colors">Feature Catalog</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Resources</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-450">
                <li><a href="#platform" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#ai-intelligence" className="hover:text-white transition-colors">AI Insights API</a></li>
                <li><a href="#analytics" className="hover:text-white transition-colors">Help & Support</a></li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Company</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-450">
                <li><a href="#testimonials" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span>© 2026 EventIntel AI. All rights reserved.</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span className="font-semibold text-slate-400">Intelligence for smarter campuses.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
