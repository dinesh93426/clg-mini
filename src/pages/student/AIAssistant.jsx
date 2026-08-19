import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { aiService } from '../../services/aiService';
import { MOCK_CHAT_HISTORY, MOCK_EVENTS } from '../../services/mockData';
import { Bot, Send, User, Sparkles, BookOpen, Clock, MapPin, Calendar, ArrowRight, RefreshCcw } from 'lucide-react';

export const AIAssistant = () => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState(MOCK_CHAT_HISTORY);
  const [inputValue, setInputValue] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeContextEvent, setActiveContextEvent] = useState(MOCK_EVENTS[0]);
  
  const chatEndRef = useRef(null);

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
    <div className="h-[calc(100vh-8.5rem)] flex gap-5 overflow-hidden">
      
      {/* Left Column: Chat History */}
      <aside className="w-60 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-3.5 hidden md:flex flex-col gap-3 shadow-xs shrink-0">
        <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider px-2">
          Threads
        </h3>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <div className="p-2.5 rounded-lg bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] text-xs font-semibold cursor-pointer">
            <span className="block truncate">Campus Events Inquiry</span>
            <span className="text-[10px] text-[#4F46E5]/80 block mt-0.5 font-normal">Active thread</span>
          </div>
          <div className="p-2.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] text-xs border border-transparent hover:border-[#E2E8F0] cursor-pointer transition-colors">
            <span className="block font-medium truncate">DSA Workshop Info</span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5">Aug 12, 2026</span>
          </div>
          <div className="p-2.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] text-xs border border-transparent hover:border-[#E2E8F0] cursor-pointer transition-colors">
            <span className="block font-medium truncate">Hackathon Registration</span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5">Aug 08, 2026</span>
          </div>
        </div>
        <button 
          onClick={() => setMessages([
            { id: "wel-01", role: "ai", text: "Hello! I am your AI campus assistant. How can I help you discover workshops or navigate events today?", timestamp: new Date().toISOString() }
          ])}
          className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <RefreshCcw size={12} /> Clear Chat
        </button>
      </aside>

      {/* Center Column: Chat Canvas */}
      <div className="flex-1 flex flex-col bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden relative min-w-0">
        {/* Chat header */}
        <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#172033] flex items-center gap-1">
                AI Campus Assistant
              </h2>
              <p className="text-[10px] text-[#64748B]">Grounded on campus event database and seating availability</p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, idx) => {
            const isAI = msg.role === 'ai' || msg.role === 'assistant';
            return (
              <div 
                key={msg.id || `msg-${idx}`}
                className={`flex gap-2.5 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold
                  ${isAI 
                    ? 'bg-[#EEECFF] text-[#4F46E5] border border-[#C7D2FE]' 
                    : 'bg-[#4F46E5] text-white'}`}
                >
                  {isAI ? <Bot size={14} /> : <User size={14} />}
                </div>

                <div className="space-y-1.5">
                  <div className={`p-3.5 rounded-xl text-xs leading-relaxed
                    ${isAI 
                      ? 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] rounded-tl-none' 
                      : 'bg-[#4F46E5] text-white rounded-tr-none'}`}
                  >
                    <div className="whitespace-pre-line">{msg.text || msg.content || msg.answer}</div>
                  </div>

                  {/* Sources tag list */}
                  {isAI && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-col gap-1 pl-1">
                      <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block">
                        Referenced Events:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((src, sidx) => (
                          <button
                            key={src.id || src.eventId || `src-${sidx}`}
                            onClick={() => selectSourceEvent(src.id || src.eventId)}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[#EEF2FF] text-[#4F46E5] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <BookOpen size={10} className="text-[#4F46E5]" />
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
            <div className="flex gap-2.5 mr-auto max-w-[80%]">
              <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] flex items-center justify-center">
                <Bot size={14} />
              </div>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl rounded-tl-none text-xs text-[#64748B] flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#4F46E5] animate-ping"></span>
                <span>Retrieving verified campus telemetry...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompt click board */}
        <div className="px-5 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0]">
          <div className="flex flex-wrap gap-1.5 py-0.5">
            {[
              "What technical workshops match my profile?",
              "Are there any AI events this week?",
              "How do I reserve seats for hackathons?"
            ].map(p => (
              <button
                key={p}
                onClick={() => handleSuggestClick(p)}
                disabled={generating}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[#EEF2FF] text-[#64748B] hover:text-[#4F46E5] transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
          className="p-3 border-t border-[#E2E8F0] flex items-center gap-2 bg-[#FFFFFF]"
        >
          <input
            type="text"
            placeholder="Ask questions about campus events, schedules, seats..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={generating}
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || generating}
            className="p-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Right Column: Event Context Panel */}
      {activeContextEvent && (
        <aside className="w-68 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 hidden lg:flex flex-col justify-between overflow-y-auto shadow-xs shrink-0">
          <div className="space-y-3">
            <span className="text-[9px] text-[#4F46E5] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEF2FF] inline-block border border-[#C7D2FE]">
              Contextual Event
            </span>
            <img 
              src={activeContextEvent.image} 
              alt={activeContextEvent.title} 
              className="w-full h-28 object-cover rounded-lg border border-[#E2E8F0]" 
            />
            <div>
              <span className="text-[9px] text-[#4F46E5] font-bold uppercase tracking-wider">{activeContextEvent.category}</span>
              <h3 className="font-semibold text-xs text-[#172033] mt-0.5 leading-snug">{activeContextEvent.title}</h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed mt-1 line-clamp-3">
                {activeContextEvent.description}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-[#94A3B8] shrink-0" />
                <span>{activeContextEvent.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-[#94A3B8] shrink-0" />
                <span>{activeContextEvent.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-[#94A3B8] shrink-0" />
                <span className="truncate">{activeContextEvent.venue}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] flex justify-between">
              <span className="text-[#64748B]">Available seats:</span>
              <span className="font-semibold text-[#172033]">{activeContextEvent.availableSeats} / {activeContextEvent.totalSeats}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0]">
            <Link
              to={`/student/events/${activeContextEvent.id}`}
              className="w-full py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </aside>
      )}

    </div>
  );
};
export default AIAssistant;
