import React from 'react';

const SkeletonWatch = () => {
 return (
 <div className="h-screen w-full bg-transparent overflow-hidden relative flex flex-col animate-pulse">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-[150]" />
 {/* Top Bar Ghost */}
 <div className="absolute top-0 inset-x-0 p-6 md:p-10 flex items-start justify-between z-[100] bg-gradient-to-b from-black via-black/40 to-transparent">
 <div className="flex items-center gap-6">
 <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-md border border-white/10 backdrop-blur-3xl" />
 <div className="space-y-2">
 <div className="h-3 w-24 bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 <div className="h-5 w-48 md:w-64 bg-white/10 backdrop-blur-md rounded-md" />
 </div>
 </div>
 <div className="flex gap-3">
 <div className="hidden md:block w-10 h-10 md:w-12 md:h-12 bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 </div>
 </div>

 {/* Main Player Ghost */}
 <div className="flex-grow w-full h-full bg-darkerSurface relative z-10 animate-pulse border-y" />

 {/* Subtle Overlay Gradients */}
 <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.5)] z-20" />
 </div>
 );
};

export default SkeletonWatch;
