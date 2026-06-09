import React from 'react';
import { BoxySearch } from './BoxyIcons';

const EmptyState = ({ message ="No Content Available", icon: Icon = BoxySearch }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center py-16 px-4 text-center md:text-left gap-8 w-full">
      {/* Mascot Placeholder */}
      <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/10 flex-shrink-0 relative overflow-hidden group">
        <img 
          src="/images/mascots/toady-empty.svg" 
          alt="Toady Mascot - Empty" 
          className="absolute inset-0 w-full h-full object-contain z-10 transition-opacity" 
          onError={(e) => e.target.style.opacity = 0}
        />
        <div className="text-white/30 text-center px-2 absolute inset-0 flex flex-col items-center justify-center -z-0">
          <Icon size={24} className="mx-auto mb-1 opacity-50" />
          <p className="text-[10px] font-bold tracking-widest uppercase text-balance">toady-empty.svg</p>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center md:items-start max-w-sm">
        <h3 className="text-h4 md:text-h3 font-bold text-white/90 tracking-tight mb-2">{message}</h3>
        <p className="text-micro font-normal text-white/50 tracking-tight leading-relaxed">
          Try exploring other areas or check back later.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
