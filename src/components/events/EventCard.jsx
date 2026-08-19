import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';

const CATEGORY_IMAGES = {
  technical: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
  workshop: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600",
  hackathon: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600",
  seminar: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600",
  cultural: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600",
  career: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=600",
  entrepreneurship: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600",
  "club activities": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600"
};

export const EventCard = ({ event, onRegister, registered = false, registering = false }) => {
  const categoryName = typeof event.category === 'object' && event.category !== null
    ? (event.category.name || 'Event')
    : (event.category || 'Event');

  const catKey = categoryName.toLowerCase();
  const defaultPoster = CATEGORY_IMAGES[catKey] || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600";
  const eventPoster = event.image || event.posterUrl || defaultPoster;

  const organizerName = typeof event.organizer === 'object' && event.organizer !== null
    ? (event.organizer.organizationName || event.organizer.name || 'Campus Committee')
    : (event.organizer || event.organizerName || 'Campus Committee');

  // Format date
  const displayDate = (() => {
    if (event.date) return event.date;
    if (event.eventDate) {
      const d = new Date(event.eventDate);
      return !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming';
    }
    return 'Upcoming';
  })();

  // Format time
  const displayTime = (() => {
    if (event.time) return event.time.split(' ')[0];
    if (event.startTime) {
      const s = String(event.startTime);
      return s.length > 5 ? s.slice(0, 5) : s;
    }
    return '10:00 AM';
  })();

  // Calculate remaining seats
  const totalSeats = event.capacity || event.totalSeats || 100;
  const registeredCount = event.registrationCount ?? event._count?.registrations ?? 0;
  const availableSeats = typeof event.availableSeats === 'number'
    ? event.availableSeats
    : Math.max(0, totalSeats - registeredCount);
  const isSoldOut = availableSeats === 0;

  return (
    <div className={`bg-[#FFFFFF] rounded-xl overflow-hidden flex flex-col justify-between group relative border ${registered ? 'border-[#FF5A1F]/50 ring-1 ring-[#FF5A1F]/20' : 'border-[#E2E8F0]'} shadow-xs hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-[#FFB49A] transition-all duration-150`}>
      
      {/* AI badge */}
      {event.aiRecommended && (
        <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-[#FFF1EB] text-[#E94712] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shadow-xs border border-[#FFD2C2]">
          <Sparkles size={11} className="text-[#FF5A1F]" /> AI Recommended
        </div>
      )}

      {/* Seating / Match indicator */}
      <div className="absolute top-3 right-3 z-10">
        {event.aiRecommended && event.aiMatchPercentage ? (
          <div className="px-2 py-0.5 rounded-md bg-[#FFF1EB] text-[#FF5A1F] text-[11px] font-semibold border border-[#FFD2C2]">
            {event.aiMatchPercentage}% Match
          </div>
        ) : (
          <div className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${isSoldOut ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'}`}>
            {isSoldOut ? 'Sold Out' : `${availableSeats} seats left`}
          </div>
        )}
      </div>

      {/* Event Image Banner */}
      <div className="h-40 overflow-hidden relative bg-[#FFF7F3]">
        <img 
          src={eventPoster} 
          alt={event.title} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultPoster;
          }}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200" 
        />
        <div className="absolute bottom-2.5 left-3">
          <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-[#FFF1EB] text-[#E94712] border border-[#FFD2C2] font-semibold uppercase tracking-wider shadow-xs">
            {categoryName}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm text-[#172033] group-hover:text-[#FF5A1F] transition-colors leading-snug line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
            {event.description}
          </p>
        </div>

        {/* Event Stats / Info */}
        <div className="space-y-1.5 pt-2.5 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[#FF5A1F]" />
            <span>{displayDate} • {displayTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[#FF5A1F]" />
            <span className="truncate">{event.venue || 'Campus Main Hall'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-[#FF5A1F]" />
            <span className="truncate">Organized by {organizerName}</span>
          </div>
        </div>

        {/* AI match reasoning overlay if recommended */}
        {event.aiRecommended && event.recommendationReason && (
          <div className="p-2 rounded-lg bg-[#FFF7F3] border-l-2 border-[#FF5A1F] text-[11px] text-[#E94712] italic">
            "{event.recommendationReason}"
          </div>
        )}

        {/* Actions bar */}
        <div className="flex gap-2 pt-1">
          <Link 
            to={`/events/${event.id}`}
            className="flex-1 py-1.5 text-center text-xs font-medium text-[#172033] bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FF5A1F] hover:text-[#FF5A1F] hover:bg-[#FFF7F3] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            <span>Details</span>
          </Link>
          
          {registered ? (
            <div className="flex-[1.4] py-1.5 text-xs font-medium bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-lg flex items-center justify-center gap-1">
              <CheckCircle2 size={13} />
              <span>Registered</span>
            </div>
          ) : (
            <button
              onClick={() => onRegister(event.id)}
              disabled={isSoldOut || registering}
              className={`flex-[1.4] py-1.5 text-xs font-medium text-white rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer
                ${isSoldOut 
                  ? 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed' 
                  : 'bg-[#FF5A1F] hover:bg-[#E94712] hover:shadow-[0_8px_20px_rgba(255,90,31,0.20)]'}`}
            >
              {registering ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span>Register</span>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
export default EventCard;
