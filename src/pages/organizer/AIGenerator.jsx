import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/aiService';
import { eventService } from '../../services/eventService';
import { BrainCircuit, Sparkles, AlertCircle, CheckCircle, RotateCw, Save, Send } from 'lucide-react';

export const AIGenerator = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Generated fields form state
  const [generatedDraft, setGeneratedDraft] = useState(null);

  // Form edit fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [agenda, setAgenda] = useState('');
  const [requirements, setRequirements] = useState('');
  const [duration, setDuration] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setError('');
    setGeneratedDraft(null);

    try {
      const data = await aiService.generateEventIdea(prompt);
      setGeneratedDraft(data);
      
      // Seed editable form states
      setTitle(data.title);
      setCategory(data.category);
      setDescription(data.description);
      setTargetAudience(data.targetAudience);
      setAgenda(data.agenda);
      setRequirements(data.requirements);
      setDuration(data.suggestedDuration);
    } catch (err) {
      setError('AI service failed to generate event structure.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!title || !description) return;
    
    try {
      await eventService.createEvent({
        title,
        category,
        description: `${description}\n\nObjectives:\n- Target: ${targetAudience}\n- Duration: ${duration}\n- Requirements: ${requirements}`,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // default 1 week from now
        time: '14:00 - 17:00',
        venue: 'Innovation Seminar Room',
        totalSeats: 100,
        tags: [category, 'AI Generated']
      });

      alert('Event published successfully!');
      navigate('/organizer/events');
    } catch (err) {
      setError('Failed to publish the draft.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
          <BrainCircuit size={26} className="text-purple-400" />
          AI Event Generator
        </h1>
        <p className="text-slate-400 text-sm mt-1">Prompt the AI engine to compose targeted campus workshops with agendas, seats, and constraints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Input prompt board (span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-2xl space-y-4 border border-slate-900">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Generation Prompt
            </h3>
            
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 rounded-lg">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  Describe what you want to create
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="e.g. Create a 1-day React 19 hands-on workshop for CSE sophomores. Focus on server components, fetching, and building a project."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={generating || !prompt.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-650 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Synthesizing template...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-purple-300" />
                    <span>Generate Event Draft</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900 text-[11px] text-slate-400 space-y-2">
            <span className="font-bold text-white uppercase block tracking-wider text-[9px]">Sample prompts:</span>
            <button 
              onClick={() => setPrompt("Create a Generative AI workshop for second-year CSE students.")}
              className="block text-left text-indigo-400 hover:underline cursor-pointer"
            >
              • "Create a Generative AI workshop for second-year CSE students."
            </button>
            <button 
              onClick={() => setPrompt("Create a Figma UI design bootcamp with design sprints.")}
              className="block text-left text-indigo-400 hover:underline cursor-pointer"
            >
              • "Create a Figma UI design bootcamp with design sprints."
            </button>
          </div>
        </div>

        {/* Right Column: Interactive editable Preview panel (span 7) */}
        <div className="lg:col-span-7">
          {!generatedDraft && !generating ? (
            <div className="py-24 text-center border-2 border-dashed border-slate-900 rounded-2xl bg-slate-950/20 text-slate-500 text-xs">
              <Sparkles size={32} className="mx-auto text-slate-700 animate-pulse mb-3" />
              <span>Enter a description on the left and trigger generation to see the draft outline.</span>
            </div>
          ) : generating ? (
            <div className="py-24 text-center border border-slate-850 rounded-2xl bg-slate-950/20 space-y-4">
              <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <BrainCircuit size={24} className="animate-spin-slow text-purple-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Synthesizing Course Curriculum</h4>
                <p className="text-xs text-slate-500">Mapping target audience competencies and formulating outline schedule...</p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl space-y-4 border border-slate-850 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Draft Editor</span>
                  <h3 className="text-sm font-bold text-white">Review Generated Outline</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleGenerate}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-350 cursor-pointer"
                    title="Regenerate"
                  >
                    <RotateCw size={12} />
                  </button>
                </div>
              </div>

              {/* Editable Fields Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Event Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 w-full text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 w-full text-slate-200"
                  >
                    <option value="AI">AI</option>
                    <option value="Technology">Technology</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Suggested Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 w-full text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Target Audience</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 w-full text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Description Summary</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 w-full text-slate-250 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Agenda & Schedule</label>
                  <textarea
                    rows={4}
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 w-full text-slate-250 font-mono focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Participation Requirements</label>
                  <input
                    type="text"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 w-full text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Publish Action Drawer */}
              <div className="pt-4 border-t border-slate-900 flex justify-end gap-2.5">
                <button
                  onClick={() => { setGeneratedDraft(null); setPrompt(''); }}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handlePublish}
                  className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  <Send size={12} />
                  <span>Publish Event</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default AIGenerator;
