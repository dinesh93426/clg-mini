import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { ArrowLeft, Save } from 'lucide-react';

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
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      
      {/* Header back link */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Events list</span>
      </button>

      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Create New Event</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Configure event schedule, venue, and seat allocations to publish.</p>
      </div>

      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-[#172033] font-semibold block mb-1">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cloud Infrastructure & DevOps Workshop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 w-full text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[#172033] font-semibold block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
              >
                <option value="AI">AI</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="text-[#172033] font-semibold block mb-1">Total Seating Capacity *</label>
              <input
                type="number"
                required
                min={5}
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
              />
            </div>
          </div>

          <div>
            <label className="text-[#172033] font-semibold block mb-1">Description & Summary *</label>
            <textarea
              required
              rows={4}
              placeholder="Write a clear event overview, prerequisites, agenda, and requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 w-full text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[#172033] font-semibold block mb-1">Venue *</label>
              <input
                type="text"
                required
                placeholder="e.g. Seminar Hall A, Technology Block"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 w-full text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F]"
              />
            </div>

            <div>
              <label className="text-[#172033] font-semibold block mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 w-full text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]"
              />
            </div>
          </div>

          <div>
            <label className="text-[#172033] font-semibold block mb-1">Time Schedule *</label>
            <input
              type="text"
              required
              placeholder="e.g. 10:00 AM - 01:00 PM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 w-full text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F]"
            />
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/organizer/events')}
              className="px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#FF5A1F] hover:bg-[#E94712] text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save size={13} />
              <span>{submitting ? 'Publishing...' : 'Publish Event'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
export default EventCreate;
