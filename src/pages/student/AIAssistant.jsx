import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { aiService } from '../../services/aiService';
import { MOCK_CHAT_HISTORY, MOCK_EVENTS } from '../../services/mockData';
import { Bot, Send, User, Sparkles, BookOpen, Clock, MapPin, Calendar, ArrowRight, CornerDownLeft, RefreshCcw } from 'lucide-react';

export const AIAssistant = () => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState(MOCK_CHAT_HISTORY);
  const [inputValue, setInputValue] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeContextEvent, setActiveContextEvent] = useState(MOCK_EVENTS[0]); // default to first event context
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || generating) return;

    const studentMessage = {
      id: `msg-${Date.now()}`,
      role: 'student',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, studentMessage]);
    setInputValue('');
    setGenerating(true);

    try {
      const aiResponse = await aiService.sendMessageToAssistant([...messages, studentMessage], user?.aiProfile);
      setMessages((prev) => [...prev, aiResponse]);
      
      // Update event context to the first source event returned, if any
      if (aiResponse.sources && aiResponse.sources.length > 0) {
        const matchingEvent = MOCK_EVENTS.find(e => e.id === aiResponse.sources[0].id);
        if (matchingEvent) {
          setActiveContextEvent(matchingEvent);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: 'ai',
        text: 'The AI assistant is temporarily unavailable. Please retry shortly.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestClick = (prompt) => {
    handleSendMessage(prompt);
  };

  const selectSourceEvent = (eventId) => {
    const ev = MOCK_EVENTS.find(e => e.id === eventId);
    if (ev) setActiveContextEvent(ev);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden">
      
      {/* Left Column: Chat History */}
      <aside className="w-64 bg-slate-950/40 border border-slate-900 rounded-2xl p-4 hidden md:flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Conversation Threads
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold cursor-pointer">
            <span className="block font-medium truncate">Campus Events Inquiry</span>
            <span className="text-[10px] text-indigo-500 block mt-1">Active thread</span>
          </div>
          <div className="p-3 rounded-xl hover:bg-slate-900/60 text-slate-400 text-xs border border-transparent hover:border-slate-800 cursor-pointer transition-colors">
            <span className="block font-medium truncate">DSA Registration Question</span>
            <span className="text-[10px] text-slate-500 block mt-1">Aug 12, 2026</span>
          </div>
          <div className="p-3 rounded-xl hover:bg-slate-900/60 text-slate-400 text-xs border border-transparent hover:border-slate-800 cursor-pointer transition-colors">
            <span className="block font-medium truncate">Food Stall Availability</span>
            <span className="text-[10px] text-slate-500 block mt-1">Aug 08, 2026</span>
          </div>
        </div>
        <button 
          onClick={() => setMessages([
            { id: "wel-01", role: "ai", text: "Hello! I am your AI campus assistant. How can I help you today?", timestamp: new Date().toISOString() }
          ])}
          className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-900 rounded-xl hover:bg-slate-900/40 transition-colors"
        >
          <RefreshCcw size={12} /> Clear Chat
        </button>
      </aside>

      {/* Center Column: Chat Canvas */}
      <div className="flex-1 flex flex-col bg-slate-950/20 border border-slate-900 rounded-2xl overflow-hidden relative">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Event Guide <Sparkles size={12} className="text-purple-400 animate-pulse" />
              </h2>
              <p className="text-[10px] text-slate-400">Trained on campus workshops, seats, and registries</p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isAI = msg.role === 'ai';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3.5 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs border font-semibold
                  ${isAI 
                    ? 'bg-purple-950/20 border-purple-800/30 text-purple-400' 
                    : 'bg-indigo-950/20 border-indigo-800/30 text-indigo-400'}`}
                >
                  {isAI ? <Bot size={14} /> : <User size={14} />}
                </div>

                <div className="space-y-2">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed
                    ${isAI 
                      ? 'bg-slate-900/60 border border-slate-850/60 text-slate-200 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10'}`}
                  >
                    {/* Preserve line breaks for AI answers */}
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>

                  {/* Sources tag list */}
                  {isAI && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-col gap-1 pl-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                        Retrieved Sources:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map(src => (
                          <button
                            key={src.id}
                            onClick={() => selectSourceEvent(src.id)}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-850 text-indigo-300 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <BookOpen size={10} className="text-slate-500" />
                            <span>{src.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {generating && (
            <div className="flex gap-3.5 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-purple-950/20 border border-purple-800/30 flex items-center justify-center text-purple-400">
                <Bot size={14} />
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-slate-850/60 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-bounce"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                </span>
                <span>Typing recommendations...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompt click board */}
        <div className="px-6 py-2 bg-slate-950/20 border-t border-slate-900">
          <div className="flex flex-wrap gap-2 py-1 justify-center sm:justify-start">
            {[
              "What events are happening tomorrow?",
              "Which workshops match my interests?",
              "Who is organizing the hackathon?",
              "How many seats are available?"
            ].map(p => (
              <button
                key={p}
                onClick={() => handleSuggestClick(p)}
                disabled={generating}
                className="text-[9px] sm:text-[10px] px-2.5 py-1 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
          className="p-4 border-t border-slate-900 flex items-center gap-3 bg-slate-950/40"
        >
          <input
            type="text"
            placeholder="Ask AI about campus hackathons, seats, schedules..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={generating}
            className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || generating}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Right Column: Event Context Panel */}
      {activeContextEvent && (
        <aside className="w-72 bg-slate-950/40 border border-slate-900 rounded-2xl p-5 hidden lg:flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block">
              Event Context
            </span>
            <img 
              src={activeContextEvent.image} 
              alt={activeContextEvent.title} 
              className="w-full h-32 object-cover rounded-xl border border-slate-850" 
            />
            <div>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{activeContextEvent.category}</span>
              <h3 className="font-display font-bold text-sm text-white mt-0.5">{activeContextEvent.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2 line-clamp-3">
                {activeContextEvent.description}
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-2 text-slate-350">
                <Calendar size={12} className="text-slate-500 shrink-0" />
                <span>{activeContextEvent.date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-350">
                <Clock size={12} className="text-slate-500 shrink-0" />
                <span>{activeContextEvent.time}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-350">
                <MapPin size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">{activeContextEvent.venue}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] flex justify-between">
              <span className="text-slate-400">Available seats:</span>
              <span className="font-bold text-white">{activeContextEvent.availableSeats} / {activeContextEvent.totalSeats}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900">
            <Link
              to={`/student/events/${activeContextEvent.id}`}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Registration details</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </aside>
      )}

    </div>
  );
};
export default AIAssistant;
