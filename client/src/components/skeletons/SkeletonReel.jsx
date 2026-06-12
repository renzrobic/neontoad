import React from 'react';

const SkeletonReel = () => (
 <div className="relative h-[100dvh] w-full snap-start bg-transparent flex items-center justify-center overflow-hidden animate-pulse">
 {/* Shimmer sweep */}
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/4 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-[150]" />

 {/* ── DESKTOP SKELETON ── */}
 <div className="hidden lg:flex absolute inset-0 z-10 items-center justify-center gap-5 px-10">
 {/* Top-left nav dots */}
 <div className="absolute top-4 left-4 flex flex-col gap-3 z-[60]">
 <div className="w-12 h-11 rounded-md bg-white/8" />
 <div className="w-12 h-11 rounded-md bg-white/8" />
 </div>

 {/* 9:16 video ghost */}
 <div className="relative h-[96vh] aspect-[9/16] bg-[#111] flex-shrink-0 overflow-hidden shadow-2xl">
 {/* Unified Top Controls Ghost */}
 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
 <div className="w-9 h-9 rounded-md bg-white/10 backdrop-blur-md" />
 <div className="w-12 h-9 rounded-md bg-white/10 backdrop-blur-md" />
 <div className="w-32 h-8 bg-white/10 backdrop-blur-md rounded-md" />
 </div>

 {/* Gradient */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

 {/* Bottom metadata ghost */}
 <div className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-10 flex flex-col gap-2">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-md bg-white/12 flex-shrink-0" />
 <div className="h-3.5 w-24 bg-white/12 rounded" />
 <div className="h-3.5 w-16 bg-white/8 rounded px-2" />
 </div>
 <div className="space-y-1.5 mt-2">
 <div className="h-3 w-full bg-white/8 rounded" />
 <div className="h-3 w-3/4 bg-white/5 backdrop-blur-md border border-white/10 rounded" />
 </div>
 </div>

 {/* Seekbar ghost */}
 <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15" />
 </div>

 {/* Right action column ghost */}
 <div className="flex flex-col items-center gap-5 pb-10 self-end">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="flex flex-col items-center gap-1">
 <div className="w-12 h-12 rounded-md bg-white/8" />
 <div className="h-2.5 w-6 bg-white/8 rounded" />
 </div>
 ))}
 <div className="w-12 h-12 rounded-md bg-white/8 mt-1" />
 </div>
 </div>

 {/* ── MOBILE SKELETON ── */}
 <div className="lg:hidden relative h-[100dvh] w-full bg-[#0a0a0a] overflow-hidden">
 {/* Top bar ghost */}
 <div className="absolute top-0 inset-x-0 z-40 px-4 pt-[40px] md:pt-[60px] pb-4 flex justify-center items-center">
 <div className="absolute left-4 w-9 h-9 rounded-md bg-white/10 backdrop-blur-md" />
 <div className="w-28 h-7 bg-white/10 backdrop-blur-md rounded-md" />
 <div className="absolute right-4 w-9 h-9 bg-white/8 rounded-md" />
 </div>

 {/* Gradient overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 z-10" />

 {/* Right action column ghost (bottom-[80px] baseline) */}
 <div className="absolute right-3 bottom-[80px] z-30 flex flex-col items-center gap-5">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="flex flex-col items-center gap-1">
 <div className="w-7 h-7 bg-white/12 rounded" />
 <div className="h-2.5 w-6 bg-white/8 rounded" />
 </div>
 ))}
 <div className="w-7 h-7 bg-white/8 rounded mt-1" />
 </div>

 {/* Bottom metadata ghost (bottom-[55px] baseline) */}
 <div className="absolute left-0 right-[72px] bottom-[55px] z-30 px-4 flex flex-col gap-2">
 <div className="flex items-center gap-2">
 <div className="w-9 h-9 rounded-md bg-white/15 flex-shrink-0" />
 <div className="h-3.5 w-20 bg-white/15 rounded" />
 <div className="h-6 w-14 bg-white/8 rounded" />
 </div>
 <div className="h-2.5 w-24 bg-white/8 rounded mt-1" />
 <div className="space-y-1.5 mt-2">
 <div className="h-3 w-full bg-white/8 rounded" />
 <div className="h-3 w-2/3 bg-white/5 backdrop-blur-md border border-white/10 rounded" />
 </div>
 </div>

 {/* Seekbar ghost */}
 <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/12 z-40" />
 </div>
 </div>
);

export default SkeletonReel;
