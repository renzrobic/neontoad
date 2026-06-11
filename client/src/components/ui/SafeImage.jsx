import React, { useState, useEffect } from 'react';

const SafeImage = ({ src, alt, className, skeletonClass ="" }) => {
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);
 const imgRef = React.useRef(null);

 useEffect(() => {
 setLoading(true);
 setError(false);
 
 if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
 setLoading(false);
 }
 }, [src]);

 return (
 <div className={`relative ${className} bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex items-center justify-center`}>
 {/* Skeleton / Loading State */}
 {loading && !error && (
 <div className={`absolute inset-0 animate-pulse bg-white/10 backdrop-blur-md rounded-xl z-10 ${skeletonClass}`} />
 )}

 {/* Error / Fallback State */}
 {error && (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 p-2 text-center z-20">
 <div className="w-6 h-6 mb-1 flex items-center justify-center opacity-20">
 <span className="text-white text-[10px]">?</span>
 </div>
 <span className="text-[8px] font-mideum text-white/90 leading-none">
 Coming Soon
 </span>
 </div>
 )}

 {/* The Actual Image */}
 <img loading="lazy"
 ref={imgRef}
 key={src}
 src={src}
 alt={alt}
 className={`${className} ${loading || error ? 'opacity-0 invisible' : 'opacity-100 visible'} transition-all duration-300`}
 onLoad={() => setLoading(false)}
 onError={() => {
 setError(true);
 setLoading(false);
 }}
 />
 </div>
 );
};

export default SafeImage;
