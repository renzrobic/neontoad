import React, { useRef, useState } from 'react';
import { BoxyChevron, BoxyStar } from '../ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SkeletonCard from '../skeletons/SkeletonCard';

// Module-level constants — not recreated on each render
const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: { staggerChildren: 0.1 }
 }
};

const itemVariants = {
 hidden: { opacity: 0, x: 20 },
 visible: { opacity: 1, x: 0 }
};

const TopTenRow = React.memo(({ title ="Top 10 Trending", data = [], loading = false }) => {
 const rowRef = useRef(null);
 const navigate = useNavigate();
 const [isNavigating, setIsNavigating] = useState(null);

 const slide = (direction) => {
 if (rowRef.current) {
 const { scrollLeft, clientWidth } = rowRef.current;
 const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
 rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
 }
 };

 if (!loading && data.length === 0) return null;

 return (
 <div className="mb-4 md:mb-8 group/row relative">

 <div className="px-4 md:px-16 flex items-center justify-between mb-4">
 <h2 className="text-h3 md:text-h2 font-bold text-white tracking-tight">
 {title}
 </h2>
 </div>

 <div className="relative group/arrows">
 <button
 onClick={() => slide('left')}
 className="absolute left-0 top-0 bottom-0 z-40 bg-black/60 w-12 hidden md:group-hover/arrows:flex items-center justify-center text-h2 hover:bg-black/90 transition-all text-white"
 >
 <BoxyChevron direction="left" size={32} />
 </button>

 <div
 ref={rowRef}
 className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scroll pr-4 md:pr-16 pl-0 pt-4 pb-6 md:pb-10"
 >
 <AnimatePresence mode="wait">
 {loading ? (
 <motion.div
 key="skeleton"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="flex gap-4 w-full flex-shrink-0"
 >
                {[...Array(10)].map((_, index) => {
                  const number = index + 1;
                  const isFirst = index === 0;
                  const isTen = index === 9;
                  
                  let marginClass = 'ml-14 md:ml-24 lg:ml-28';
                  let scrollClass = 'scroll-ml-4 md:scroll-ml-16';
          
                  if (isFirst) {
                    marginClass = 'ml-14 md:ml-32 lg:ml-40';
                    scrollClass = 'scroll-ml-14 md:scroll-ml-32 lg:scroll-ml-40';
                  } else if (isTen) {
                    marginClass = 'ml-20 md:ml-36 lg:ml-44';
                  }

                  return (
                    <div key={index} className={`relative flex-shrink-0 ${marginClass} mr-2 md:mr-4 lg:mr-6 snap-start ${scrollClass}`}>
                      {/* Giant Number Ghost */}
                      <div className="absolute -left-12 md:-left-24 lg:-left-32 bottom-[-10px] md:bottom-[-20px] lg:bottom-[-30px] z-0 select-none pointer-events-none">
                        <span 
                          className="text-[100px] md:text-[180px] lg:text-[220px] font-black leading-none"
                          style={{
                            WebkitTextStroke: '3px rgba(255,255,255,0.1)',
                            color: 'transparent',
                            fontFamily: 'Impact, sans-serif'
                          }}
                        >
                          {number}
                        </span>
                      </div>
                      
                      <div className="relative z-10 w-[calc((100vw-50px)/2.5)] md:w-[calc((100vw-216px)/5.5)] lg:w-[calc((100vw-216px)/6.5)] aspect-[2/3] overflow-hidden transition-transform duration-300 bg-neutral-900 border-none">
                        <SkeletonCard />
                      </div>
                    </div>
                  );
                })}
 </motion.div>
 ) : (
 <motion.div
 key="content"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="flex w-full flex-shrink-0 items-center"
 >
 {data.slice(0, 10).map((anime, index) => {
 let isNewEpisode = false;
 if (anime.lastEpisodeAddedAt) {
 const date = anime.lastEpisodeAddedAt.toDate ? anime.lastEpisodeAddedAt.toDate() : new Date(anime.lastEpisodeAddedAt);
 const now = new Date();
 const diffTime = Math.abs(now - date);
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 isNewEpisode = diffDays <= 14;
 }

 const isFirst = index === 0;
 const isTen = index === 9;
 const textSize = 'text-[120px] md:text-[200px] lg:text-[260px]';
 const letterSpacing = isTen ? '-8px' : '-5px';
 const positioning = isTen
   ? 'right-[calc(100%-60px)] md:right-[calc(100%-90px)] lg:right-[calc(100%-130px)]'
   : 'right-[calc(100%-20px)] md:right-[calc(100%-35px)] lg:right-[calc(100%-45px)]';

 let marginClass = 'ml-14 md:ml-24 lg:ml-28';
 let scrollClass = 'scroll-ml-4 md:scroll-ml-16';

 if (isFirst) {
   marginClass = 'ml-14 md:ml-32 lg:ml-40';
   scrollClass = 'scroll-ml-14 md:scroll-ml-32 lg:scroll-ml-40';
 } else if (isTen) {
   marginClass = 'ml-20 md:ml-36 lg:ml-44';
 }

 return (
 <motion.div
 key={anime.id}
 variants={itemVariants}
 className={`relative flex-shrink-0 group cursor-pointer ${marginClass} mr-2 md:mr-4 lg:mr-6 snap-start ${scrollClass}`}
 onClick={() => {
 if (isNavigating) return;
 setIsNavigating(anime.id);
 setTimeout(() => navigate(`/anime/${anime.id}`), 0);
 }}
 style={{ zIndex: 20 - index }}
 >
 {/* The Giant Stroke Number */}
 <div
 className={`absolute whitespace-nowrap ${positioning} top-1/2 -translate-y-1/2 select-none pointer-events-none text-transparent z-0 ${textSize}`}
 style={{
 WebkitTextStroke: '2px rgba(255,255,255,0.2)',
 lineHeight: '1',
 fontWeight: 900,
 fontFamily: '"Arial Black", Impact, sans-serif',
 letterSpacing: letterSpacing,
 }}
 >
 {index + 1}
 </div>

 {/* Fade shadow between number and card */}
 {!isFirst && (
   <div className="absolute inset-y-[-10px] left-0 w-16 md:w-24 bg-gradient-to-r from-transparent to-black/90 -translate-x-full z-[5] pointer-events-none blur-sm" />
 )}

 {/* The Anime Poster */}
 <div className="relative z-10 w-[calc((100vw-50px)/2.5)] md:w-[calc((100vw-216px)/5.5)] lg:w-[calc((100vw-216px)/6.5)] aspect-[2/3] overflow-hidden transition-transform duration-300 bg-neutral-900 border-none shadow-[-20px_0_30px_rgba(0,0,0,0.9)]">
 {isNavigating === anime.id && (
 <div className="absolute inset-0 z-[100] bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
 <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
 </div>
 )}
 {isNewEpisode && (
 <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 bg-primary text-black text-micro font-bold px-2.5 py-1 rounded-none shadow-lg whitespace-nowrap group-hover:opacity-0 transition-opacity duration-300">
 New Episode
 </div>
 )}
 <img
 loading="lazy"
 src={anime.image}
 alt={anime.title}
 className="w-full h-full object-cover"
 />
 {/* Premium Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

 <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 translate-y-2 group-hover:translate-y-0">
 <h3 className="text-white font-semibold text-body md:text-h4 leading-tight mb-2">{anime.title}</h3>

 <div className="flex flex-col gap-1.5 mb-4">
 <div className="flex items-center gap-2">
 <span className="text-white/90 font-medium text-body">{anime.rating || '0.0'}</span>
 <BoxyStar size={12} fill="currentColor" className="text-white/90" />
 <span className="text-white/90 text-micro font-medium">({anime.votes || '0'})</span>
 </div>

 <div className="flex flex-col text-micro font-medium text-white/90 tracking-tight">
 <span>{anime.type || 'Series'}</span>
 <span>{anime.episodes?.toString().toLowerCase().includes('episodes') ? anime.episodes : `${anime.episodes || '0'} episodes`}</span>
 </div>
 </div>

 <div className="hidden md:block">
 <p className="text-white/90 text-micro leading-relaxed line-clamp-3 mb-2 font-medium">
 {anime.description || 'No description available for this title.'}
 </p>
 </div>
 </div>
 </div>
 </motion.div>
 )
 })}
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 onClick={() => slide('right')}
 className="absolute right-0 top-0 bottom-0 z-40 bg-black/60 w-12 hidden md:group-hover/arrows:flex items-center justify-center text-h2 hover:bg-black/90 transition-all text-white"
 >
 <BoxyChevron direction="right" size={32} />
 </button>
 </div>
 </div>
 );
});

export default TopTenRow;
