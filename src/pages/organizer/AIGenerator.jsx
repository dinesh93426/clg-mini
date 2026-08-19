import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/aiService';
import { eventService } from '../../services/eventService';
import { BrainCircuit, Sparkles, AlertCircle, RotateCw, Send } from 'lucide-react';

export const AIGenerator = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const [generatedDraft, setGeneratedDraft] = useState(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [agenda, setAgenda] = useState('');
  const [requirements, setRequirements] = useState('');
  const [duration, setDuration] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setError('');
    setGeneratedDraft(null);

    try {
      const data = await aiService.generateEventIdea(prompt);
      setGeneratedDraft(data);
      
      setTitle(data.title);
      setCategory(data.category);
      setDescription(data.description);
      setTargetAudience(data.targetAudience);
      setAgenda(data.agenda);
      setRequirements(data.requirements);
      setDuration(data.suggestedDuration);
      setImageUrl(data.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80');
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
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:00 - 17:00',
        venue: 'Innovation Seminar Room',
        totalSeats: 100,
        image: imageUrl,
        tags: [category, 'AI Generated']
      });

      alert('Event published successfully!');
      navigate('/organizer/events');
    } catch (err) {
      setError('Failed to publish the draft.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
          <BrainCircuit size={22} className="text-[#FF5A1F]" />
          AI Event Generator
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">Prompt the AI engine to compose structured campus workshops with agendas, seating, and constraints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Input prompt board (span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl space-y-4 border border-[#E2E8F0] shadow-xs">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Generation Prompt
            </h3>
            
            {error && (
              <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2 rounded-lg">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-[#64748B] font-bold uppercase tracking-wider mb-1">
                  Describe what you want to create
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="e.g. Create a 1-day React 19 hands-on workshop for CSE sophomores. Focus on server components, fetching, and building a project."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={generating || !prompt.trim()}
                className="w-full py-2.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Synthesizing template...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Event Draft</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-xs text-[#64748B] space-y-2 shadow-xs">
            <span className="font-bold text-[#172033] uppercase block tracking-wider text-[10px]">Sample Prompts:</span>
            <button 
              onClick={() => setPrompt("Create a Generative AI workshop for second-year CSE students.")}
              className="block text-left text-[#FF5A1F] hover:underline cursor-pointer"
            >
              • "Create a Generative AI workshop for second-year CSE students."
            </button>
            <button 
              onClick={() => setPrompt("Create a Figma UI design bootcamp with hands-on design sprints.")}
              className="block text-left text-[#FF5A1F] hover:underline cursor-pointer"
            >
              • "Create a Figma UI design bootcamp with hands-on design sprints."
            </button>
          </div>
        </div>

        {/* Right Column: Interactive editable Preview panel (span 7) */}
        <div className="lg:col-span-7">
          {!generatedDraft && !generating ? (
            <div className="py-20 text-center border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] text-[#94A3B8] text-xs shadow-xs p-6">
              <Sparkles size={28} className="mx-auto text-[#FFD2C2] mb-2" />
              <h4 className="font-semibold text-[#172033] text-sm mb-1">No Draft Generated Yet</h4>
              <p className="max-w-xs mx-auto text-xs text-[#64748B]">Enter a prompt on the left and click Generate Event Draft to synthesize a complete curriculum.</p>
            </div>
          ) : generating ? (
            <div className="py-20 text-center border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] space-y-3 shadow-xs">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF1EB] text-[#FF5A1F]">
                <BrainCircuit size={22} className="animate-spin text-[#FF5A1F]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[#172033]">Synthesizing Curriculum</h4>
                <p className="text-xs text-[#64748B]">Formulating target audience competencies, schedule, and assets...</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] p-6 rounded-2xl space-y-4 border border-[#E2E8F0] shadow-xs text-xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="text-[10px] text-[#FF5A1F] font-bold uppercase tracking-wider">Draft Editor</span>
                  <h3 className="text-sm font-bold text-[#172033]">Review Generated Outline</h3>
                </div>
                <button 
                  onClick={handleGenerate}
                  className="p-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                  title="Regenerate"
                >
                  <RotateCw size={13} />
                </button>
              </div>

              {/* AI Generated Image Preview */}
              {imageUrl && (
                <div className="w-full h-44 rounded-xl overflow-hidden border border-[#E2E8F0] relative">
                  <img src={imageUrl} alt="AI Generated Event Cover" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-[#172033]/80 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <Sparkles size={10} className="text-[#818CF8]" /> AI Visual
                  </div>
                </div>
              )}

              {/* Editable Fields Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-[#172033] font-semibold block mb-1">Event Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div>
                  <label className="text-[#172033] font-semibold block mb-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                  >
                    <option value="AI">AI</option>
                    <option value="Technology">Technology</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#172033] font-semibold block mb-1">Suggested Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#172033] font-semibold block mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#172033] font-semibold block mb-1">Description Summary</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#172033] font-semibold block mb-1">Agenda & Schedule</label>
                  <textarea
                    rows={3}
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#172033] font-mono focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#172033] font-semibold block mb-1">Participation Requirements</label>
                  <input
                    type="text"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>

              {/* Publish Action Drawer */}
              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  onClick={() => { setGeneratedDraft(null); setPrompt(''); }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] font-semibold transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handlePublish}
                  className="px-4 py-1.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
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
