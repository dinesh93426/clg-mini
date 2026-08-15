import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';

export const EventCreate = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [totalSeats, setTotalSeats] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !venue || !date || !time) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await eventService.createEvent({
        title,
        category,
        description,
        venue,
        date,
        time,
        totalSeats: Number(totalSeats)
      });
      alert('Event published successfully!');
      navigate('/organizer/events');
    } catch (err) {
      alert(err.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Header back link */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Events list</span>
      </button>

      <div>
        <h1 className="font-display font-bold text-3xl text-white">Create New Event</h1>
        <p className="text-slate-400 text-sm mt-1">Configure event details and seats allocation to publish manually.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-900">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          <div>
            <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Docker and Kubernetes Deep-Dive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 w-full text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 w-full text-white"
              >
                <option value="AI">AI</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Total Seating Capacity *</label>
              <input
                type="number"
                required
                min={5}
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 w-full text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Description & Summary *</label>
            <textarea
              required
              rows={4}
              placeholder="Write a clear event overview, prerequisites, objectives, and what to bring..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 w-full text-white placeholder-slate-650 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Venue Details *</label>
              <input
                type="text"
                required
                placeholder="e.g. Auditorium 2, MBA Block"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 w-full text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Scheduled Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 w-full text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[9px]">Scheduled Timing *</label>
            <input
              type="text"
              required
              placeholder="e.g. 14:00 - 17:00"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 w-full text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/organizer/events')}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <Save size={12} />
              <span>{submitting ? 'Publishing...' : 'Publish Campaign'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
export default EventCreate;
