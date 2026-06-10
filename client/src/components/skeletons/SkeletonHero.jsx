import React from 'react';

const SkeletonHero = () => {
 return (
 <div className="relative min-h-[85vh] md:min-h-[95vh] h-auto w-full bg-background animate-pulse overflow-hidden flex flex-col justify-end pt-[env(safe-area-inset-top)]">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

 {/* Content Ghost - Aligned with AnimeRow */}
 <div className="relative h-full px-4 md:px-16 w-full flex flex-col justify-end pt-24 md:pt-40 pb-12 md:pb-32 gap-3 md:gap-4 z-10">
 <div className="z-10">
 {/* Title */}
 <div className="h-12 md:h-[72px] w-3/4 max-w-4xl bg-neutral-800 mb-4 md:mb-6" />

 {/* Metadata */}
 <div className="flex flex-wrap items-center gap-4 mb-6">
 <div className="h-6 w-32 bg-neutral-800" />
 <div className="h-6 w-20 bg-neutral-900" />
 <div className="h-4 w-24 bg-neutral-900" />
 </div>

 {/* Description */}
 <div className="space-y-3 mb-6 md:mb-8 max-w-xl">
 <div className="h-4 w-full bg-neutral-900" />
 <div className="h-4 w-full bg-neutral-900" />
 <div className="h-4 w-2/3 bg-neutral-900" />
 </div>

 {/* Buttons */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-6">
 <div className="h-12 w-full sm:w-[160px] bg-neutral-700 rounded-none" />
 <div className="h-12 w-full sm:w-[160px] bg-neutral-900 rounded-none" />
 </div>
 </div>
 </div>
 </div>

 );
};

export default SkeletonHero;
