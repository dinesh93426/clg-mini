import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';

export const EventCard = ({ event, onRegister, registered = false, registering = false }) => {
  const isSoldOut = event.availableSeats === 0;

  const organizerName = typeof event.organizer === 'object' && event.organizer !== null
    ? (event.organizer.name || 'Campus Committee')
    : (event.organizer || event.organizerName || 'Campus Committee');

  const categoryName = typeof event.category === 'object' && event.category !== null
    ? (event.category.name || 'Event')
    : (event.category || 'Event');

  return (
    <div className={`bg-[#FFFFFF] rounded-xl overflow-hidden flex flex-col justify-between group relative border ${registered ? 'border-[#4F46E5]/50 ring-1 ring-[#4F46E5]/20' : 'border-[#E2E8F0]'} shadow-xs hover:shadow-md hover:border-[#CBD5E1] transition-all duration-150`}>
      
      {/* AI badge */}
      {event.aiRecommended && (
        <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-[#FFFFFF]/95 text-[#4F46E5] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shadow-xs border border-[#E2E8F0]">
          <Sparkles size={11} className="text-[#4F46E5]" /> AI Recommended
        </div>
      )}

      {/* Seating / Match indicator */}
      <div className="absolute top-3 right-3 z-10">
        {event.aiRecommended && event.aiMatchPercentage ? (
          <div className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-semibold border border-[#C7D2FE]">
            {event.aiMatchPercentage}% Match
          </div>
        ) : (
          <div className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${isSoldOut ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'}`}>
            {isSoldOut ? 'Sold Out' : `${event.availableSeats} seats left`}
          </div>
        )}
      </div>

      {/* Event Image Banner */}
      <div className="h-40 overflow-hidden relative bg-[#EEF2FF]">
        <img 
          src={event.image || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600"} 
          alt={event.title} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600";
          }}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200" 
        />
        <div className="absolute bottom-2.5 left-3">
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FFFFFF]/90 text-[#172033] border border-[#E2E8F0] font-semibold uppercase tracking-wider shadow-xs">
            {categoryName}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm text-[#172033] group-hover:text-[#4F46E5] transition-colors leading-snug line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
            {event.description}
          </p>
        </div>

        {/* Event Stats / Info */}
        <div className="space-y-1.5 pt-2.5 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[#94A3B8]" />
            <span>{event.date} • {event.time?.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[#94A3B8]" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-[#94A3B8]" />
            <span className="truncate">Organized by {organizerName}</span>
          </div>
        </div>

        {/* AI match reasoning overlay if recommended */}
        {event.aiRecommended && event.recommendationReason && (
          <div className="p-2 rounded-lg bg-[#F8FAFC] border-l-2 border-[#4F46E5] text-[11px] text-[#64748B] italic">
            "{event.recommendationReason}"
          </div>
        )}

        {/* Actions bar */}
        <div className="flex gap-2 pt-1">
          <Link 
            to={`/student/events/${event.id}`}
            className="flex-1 py-1.5 text-center text-xs font-medium text-[#172033] bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
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
              className={`flex-[1.4] py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer
                ${isSoldOut 
                  ? 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed' 
                  : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}
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
