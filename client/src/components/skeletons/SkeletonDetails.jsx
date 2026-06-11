import React from 'react';

const SkeletonDetails = () => {
 return (
 <div className="bg-background min-h-screen animate-pulse overflow-hidden relative">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-[150]" />
 {/* Ghost Banner Outer */}
 <div className="relative min-h-[40vh] md:min-h-[60vh] w-full flex flex-col justify-end pt-[env(safe-area-inset-top)]">
 <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 
 {/* Ghost Header Content */}
 <div className="relative w-full px-6 md:px-16 pt-64 pb-24 md:pb-32 z-10">
 <div className="max-w-4xl">
 <div className="h-3 w-32 bg-primary/10 mb-4 block" />
 <div className="h-12 md:h-[60px] w-3/4 bg-white/10 backdrop-blur-md rounded-xl mb-8" />
 
 <div className="flex flex-wrap items-center gap-3 my-8">
 <div className="h-12 w-[140px] bg-neutral-700" />
 <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl" />
 <div className="h-12 w-[120px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>

 <div className="mt-8 flex flex-wrap items-center gap-4">
 <div className="h-7 w-20 bg-white/10 backdrop-blur-md rounded-xl" />
 <div className="h-5 w-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-5 w-20 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>

 <div className="mt-8 space-y-3 max-w-2xl">
 <div className="h-4 w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-4 w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-4 w-3/4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>
 </div>
 </div>
 </div>

 <div className="max-w-full mt-4 md:mt-8 mx-auto px-6 md:px-16 pb-16 relative z-20">
 <div className="flex flex-col lg:flex-row gap-10 lg:-mt-16">
 {/* Left: Poster Column */}
 <div className="w-[160px] md:w-[200px] mx-auto lg:mx-0 lg:w-60 flex-shrink-0 relative z-30 space-y-6">
 <div className="rounded-xl overflow-hidden shadow-2xl aspect-[2/3] bg-surface w-full" />
 <div className="glass-panel p-5 rounded-xl space-y-6 w-full">
 <div className="flex justify-between items-center py-2">
 <div className="h-3 w-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-3 w-20 bg-white/10 backdrop-blur-md rounded-xl" />
 </div>
 <div className="flex justify-between items-center py-2">
 <div className="h-3 w-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-3 w-16 bg-white/10 backdrop-blur-md rounded-xl" />
 </div>
 <div className="flex justify-between items-center py-2">
 <div className="h-3 w-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-3 w-24 bg-white/10 backdrop-blur-md rounded-xl" />
 </div>
 </div>
 </div>
 
 {/* Right: Episodes Column */}
 <div className="flex-grow space-y-4 min-w-0 lg:pt-1">
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
 <div className="h-8 w-32 bg-white/10 backdrop-blur-md rounded-xl" />
 <div className="h-10 w-full sm:w-32 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>

 <div className="grid grid-cols-1 gap-6 pt-4">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-8 group">
 <div className="relative w-full md:w-48 lg:w-56 flex-shrink-0 aspect-video bg-surface rounded-xl overflow-hidden shadow-2xl" />
 <div className="flex flex-col justify-center gap-3 flex-grow">
 <div className="h-3 w-24 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-5 w-3/4 bg-white/10 backdrop-blur-md rounded-xl" />
 <div className="space-y-2 mt-2">
 <div className="h-3 w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-3 w-2/3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default SkeletonDetails;
