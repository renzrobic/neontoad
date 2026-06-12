import React from 'react';

const SkeletonProfile = () => {
 return (
 <div className="flex flex-col items-center gap-5 animate-pulse">
 <div className="w-28 h-28 md:w-36 md:h-36 rounded-md bg-white/5 backdrop-blur-md border border-white/10" />
 <div className="h-3 bg-white/10 backdrop-blur-md rounded-md rounded-md w-20" />
 </div>
 );
};

export default SkeletonProfile;
