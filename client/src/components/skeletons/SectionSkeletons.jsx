import React from 'react';

export const AdSkeleton = () => (
 <div className="px-6 md:px-16 my-12 md:my-20 animate-pulse relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-[150]" />
 <div className="w-full h-[250px] md:h-[400px] bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 </div>
);

export const NewsSkeleton = () => (
 <div className="px-6 md:px-16 py-12 md:py-20 animate-pulse relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-[150]" />
 <div className="flex justify-between items-end mb-12">
 <div className="space-y-4">
 <div className="h-10 bg-white/5 backdrop-blur-md rounded-md border border-white/10 w-64" />
 <div className="h-4 bg-white/5 backdrop-blur-md rounded-md border border-white/10 w-32" />
 </div>
 <div className="h-6 bg-white/5 backdrop-blur-md rounded-md border border-white/10 w-24" />
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 h-[300px] md:h-[500px] bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 <div className="space-y-6">
 {[1,2,3].map(i => (
 <div key={i} className="flex gap-4">
 <div className="w-24 md:w-32 h-24 md:h-32 bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 <div className="flex-grow space-y-3">
 <div className="h-3 bg-white/5 backdrop-blur-md rounded-md border border-white/10 w-16" />
 <div className="h-4 bg-white/5 backdrop-blur-md rounded-md border border-white/10 w-full" />
 <div className="h-4 bg-white/5 backdrop-blur-md rounded-md border border-white/10 w-2/3" />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
);

export const ScheduleSkeleton = () => (
 <div className="px-6 md:px-16 py-12 md:py-20 animate-pulse relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-[150]" />
 <div className="h-8 bg-white/5 backdrop-blur-md rounded-md border border-white/10 w-48 mb-10" />
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {[1,2,3,4].map(i => (
 <div key={i} className="h-40 bg-white/5 backdrop-blur-md rounded-md border border-white/10" />
 ))}
 </div>
 </div>
);
