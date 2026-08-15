import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, MapPin, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export const EventCard = ({ event, onRegister, registered = false, registering = false }) => {
  const isSoldOut = event.availableSeats === 0;

  return (
    <div className={`glass-card rounded-2xl overflow-hidden flex flex-col justify-between group relative border ${registered ? 'border-indigo-500/30' : 'border-slate-800'}`}>
      
      {/* Sparkle badge for AI suggestions */}
      {event.aiRecommended && (
        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-lg bg-purple-600/90 text-white text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-lg shadow-purple-600/20 backdrop-blur-sm">
          <Sparkles size={8} className="animate-spin-slow" /> AI Recommended
        </div>
      )}

      {/* Seating / Match indicator */}
      <div className="absolute top-3 right-3 z-10">
        {event.aiRecommended && event.aiMatchPercentage ? (
          <div className="px-2 py-0.5 rounded-lg bg-slate-950/80 text-purple-300 text-[10px] font-bold border border-purple-500/20 backdrop-blur-sm">
            {event.aiMatchPercentage}% Match
          </div>
        ) : (
          <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold backdrop-blur-sm ${isSoldOut ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-950/80 text-emerald-300 border border-emerald-500/20'}`}>
            {isSoldOut ? 'Sold Out' : `${event.availableSeats} seats left`}
          </div>
        )}
      </div>

      {/* Event Header Banner */}
      <div className="h-40 overflow-hidden relative bg-slate-900">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"></div>
        <div className="absolute bottom-3 left-4">
          <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">
            {event.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-display font-bold text-sm text-white group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">
            {event.title}
          </h3>
          <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
            {event.description}
          </p>
        </div>

        {/* Event Stats / Info */}
        <div className="space-y-2 pt-2 border-t border-slate-900/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-slate-500" />
            <span>{event.date} • {event.time.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-slate-500" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={12} className="text-slate-500" />
            <span>Organized by {event.organizer}</span>
          </div>
        </div>

        {/* AI match reasoning overlay if recommended */}
        {event.aiRecommended && event.recommendationReason && (
          <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[10px] text-purple-300 italic">
            "{event.recommendationReason}"
          </div>
        )}

        {/* Actions bar */}
        <div className="flex gap-2.5 pt-2">
          <Link 
            to={`/student/events/${event.id}`}
            className="flex-1 py-2 text-center text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <span>Details</span>
          </Link>
          
          {registered ? (
            <div className="flex-[1.5] py-2 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center gap-1">
              <CheckCircle2 size={12} />
              <span>Registered</span>
            </div>
          ) : (
            <button
              onClick={() => onRegister(event.id)}
              disabled={isSoldOut || registering}
              className={`flex-[1.5] py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer
                ${isSoldOut 
                  ? 'bg-slate-800 text-slate-500 border border-slate-750 shadow-none cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15 hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {registering ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
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
