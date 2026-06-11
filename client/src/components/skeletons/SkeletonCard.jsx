import React from 'react';

const SkeletonCard = () => {
 return (
 <div className="relative aspect-[2/3] w-full rounded-none overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 animate-pulse">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
 </div>
 );
};

export default SkeletonCard;
