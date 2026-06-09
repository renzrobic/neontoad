import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoxyStar, BoxyPlay, BoxyBookmark, BoxyPlus } from '../ui/BoxyIcons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import AddToListModal from './AddToListModal';

const AnimeCard = React.memo(({ anime }) => {
 const [isHovered, setIsHovered] = useState(false);
 const [isNavigating, setIsNavigating] = useState(false);
 const [isListModalOpen, setIsListModalOpen] = useState(false);
 const navigate = useNavigate();

  const { activeProfile, toggleFavorite } = useAuth();
  
  const isFavorite = activeProfile?.favorites?.some(f => f.id === anime.id);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isNavigating) return;
    setIsNavigating(true);
    const url = anime.episodes?.[0]?.id ? `/watch/${anime.episodes[0].id}` : `/anime/${anime.id}`;
    setTimeout(() => navigate(url), 0);
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!activeProfile) {
      toast.error('Please select a profile first');
      return;
    }
    await toggleFavorite(anime);
    toast.success(isFavorite ? 'Removed from your list' : 'Added to your list');
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    if (!activeProfile) {
      toast.error('Please select a profile first');
      return;
    }
    setIsListModalOpen(true);
  };

 const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

 const isNewEpisode = React.useMemo(() => {
 if (!anime.lastEpisodeAddedAt) return false;
 const date = anime.lastEpisodeAddedAt.toDate ? anime.lastEpisodeAddedAt.toDate() : new Date(anime.lastEpisodeAddedAt);
 const now = new Date();
 const diffTime = Math.abs(now - date);
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 return diffDays <= 14;
 }, [anime.lastEpisodeAddedAt]);

 return (
 <motion.div
 transition={{ duration: 0.3, ease:"easeOut" }}
 className="relative cursor-pointer aspect-[2/3] w-full bg-neutral-900 overflow-hidden group border-none"
 onClick={() => {
 if (isNavigating) return;
 setIsNavigating(true);
 setTimeout(() => {
 navigate(anime.link || `/anime/${anime.id}`);
 }, 0);
 }}
 >
 <div className="absolute inset-0 bg-neutral-900 z-0 flex items-center justify-center p-4 text-center">
 <span className="text-[10px] font-medium text-white/5">{anime.title}</span>
 </div>
 
 {isNavigating && (
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
 src={anime.image}
 alt={anime.title}
 className="relative z-10 w-full h-full object-cover transition-transform duration-500"
 loading="lazy"
 />

 {/* Premium Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

 <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 translate-y-2 group-hover:translate-y-0">
 <h3 className="text-white font-semibold text-micro md:text-h4 leading-tight mb-1 md:mb-2 line-clamp-2">{anime.title}</h3>

 <div className="flex flex-col gap-1 md:gap-1.5 mb-2 md:mb-4">
 <div className="flex items-center gap-1.5 md:gap-2">
 <span className="text-white/90 font-medium text-[10px] md:text-body">{anime.rating || '0.0'}</span>
 <BoxyStar size={10} fill="currentColor" className="text-white/90 md:w-3 md:h-3" />
 <span className="text-white/90 text-[9px] md:text-micro font-medium">({anime.votes || '0'})</span>
 </div>

 <div className="flex flex-col text-[9px] md:text-micro font-medium text-white/90 tracking-tight">
 <span>{anime.type || 'Series'}</span>
 <span>{anime.episodes?.toString().toLowerCase().includes('episodes') ? anime.episodes : `${anime.episodes || '0'} episodes`}</span>
 </div>
 </div>

  <div className="hidden md:block">
    <p className="text-white/90 text-micro leading-relaxed line-clamp-3 mb-2 font-medium">
      {anime.description || 'No description available for this title.'}
    </p>
  </div>

  <div className="flex items-center gap-4 mt-1 md:mt-2">
    <button onClick={handlePlay} className="text-primary hover:text-white transition-colors" title="Play">
      <BoxyPlay size={20} className="md:w-6 md:h-6" />
    </button>
    <button onClick={handleBookmark} className="text-primary hover:text-white transition-colors" title={isFavorite ? "Remove from List" : "Add to List"}>
      <BoxyBookmark size={20} className={`md:w-6 md:h-6 ${isFavorite ? 'fill-primary' : ''}`} />
    </button>
    <button onClick={handlePlus} className="text-primary hover:text-white transition-colors" title="Add to Collection">
      <BoxyPlus size={24} className="md:w-7 md:h-7" />
    </button>
  </div>
  </div>


 {/* Always-visible subtle bottom shadow */}
 <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent z-20 group-hover:opacity-0 transition-opacity duration-300 flex items-end p-3">
 <h3 className="text-white font-semibold text-[11px] leading-tight line-clamp-2 md:hidden">{anime.title}</h3>
 </div>

 {anime.progress !== undefined && (
 <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-700 z-40">
 <div className="h-full bg-primary" style={{ width: `${anime.progress}%` }} />
 </div>
 )}

  <AddToListModal
    isOpen={isListModalOpen}
    onClose={() => setIsListModalOpen(false)}
    anime={anime}
  />
 </motion.div>
 );
});

export default AnimeCard;
