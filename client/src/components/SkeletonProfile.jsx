import React from 'react';

const SkeletonProfile = () => {
 return (
 <div className="flex flex-col items-center gap-5 animate-pulse">
 <div className="w-28 h-28 md:w-36 md:h-36 rounded-none bg-neutral-900" />
 <div className="h-3 bg-neutral-800 rounded-none w-20" />
 </div>
 );
};

export default SkeletonProfile;
