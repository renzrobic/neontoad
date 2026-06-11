import React, { useRef, useState, useEffect } from 'react';
import { BoxyChevron } from '../ui/BoxyIcons';
import AnimeCard from './AnimeCard';
import SkeletonCard from '../skeletons/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

const AnimeRow = React.memo(({ title, genre, data, loading: externalLoading }) => {
 const rowRef = useRef(null);
 const [animeList, setAnimeList] = useState([]);
 const [internalLoading, setInternalLoading] = useState(true);
 const navigate = useNavigate();

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: {
 staggerChildren: 0.05
 }
 }
 };

 const itemVariants = {
 hidden: { opacity: 0, x: 20 },
 visible: { opacity: 1, x: 0 }
 };

 useEffect(() => {
 if (data) {
 setAnimeList(data);
 setInternalLoading(false);
 return;
 }

 const fetchAnime = async () => {
 setInternalLoading(true);
 try {
 let q;
 if (genre) {
 q = query(collection(db, 'anime'), where('genres', 'array-contains', genre), limit(25));
 } else {
 q = query(collection(db, 'anime'), limit(25));
 }

 const querySnapshot = await getDocs(q);
 const fetchedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

 setAnimeList(fetchedData);
 setInternalLoading(false);
 } catch (error) {
 console.error("Error fetching anime:", error);
 setInternalLoading(false);
 }
 };

 fetchAnime();
 }, [genre, data]);

 const isLoading = data ? externalLoading : internalLoading;

 const slide = (direction) => {
 if (rowRef.current) {
 const { scrollLeft, clientWidth } = rowRef.current;
 const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
 rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
 }
 };

 if (!isLoading && animeList.length === 0) return null;

 return (
 <div className="py-6 md:py-10 group/row relative">
 <div className="px-6 md:px-16 flex items-center justify-between mb-6 md:mb-8">
 <h2
 onClick={() => navigate(`/library?genre=${genre || 'All'}`)}
 className="text-2xl md:text-3xl font-extrabold text-white/90 group-hover/row:text-white transition-colors cursor-pointer tracking-tight"
 >
 {title}
 </h2>
 <span
 onClick={() => navigate(`/library?genre=${genre || 'All'}`)}
 className="text-sm font-semibold text-white/50 hover:text-white cursor-pointer transition-colors tracking-wide uppercase"
 >
 Explore all
 </span>
 </div>

 <div className="relative group/arrows">
 <button
 onClick={() => slide('left')}
 className="absolute left-0 top-0 bottom-0 z-40 bg-white/10 w-12 hidden md:group-hover/arrows:flex items-center justify-center text-h2 hover:bg-neutral-900/90 transition-all text-white"
 >
 <BoxyChevron direction="left" size={32} />
 </button>

 <div
 ref={rowRef}
 className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth px-6 md:px-16 no-scrollbar netflix-row pb-8 md:pb-12 pt-2 -mx-2 md:-mx-4"
 >
 <AnimatePresence mode="wait">
 {isLoading ? (
 <motion.div
 key="skeleton"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="flex gap-4 md:gap-6 w-full flex-shrink-0"
 >
 {[...Array(6)].map((_, i) => (
 <div key={i} className="flex-shrink-0 w-[calc((100vw-50px)/2.5)] md:w-[calc((100vw-216px)/5.5)] lg:w-[calc((100vw-248px)/6)]">
 <SkeletonCard />
 </div>
 ))}
 </motion.div>
 ) : (
 <motion.div
 key="content"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="flex gap-4 md:gap-6 w-full flex-shrink-0"
 >
 {animeList.map((anime) => (
 <motion.div
 key={anime.id}
 variants={itemVariants}
 className="flex-shrink-0 w-[calc((100vw-50px)/2.5)] md:w-[calc((100vw-216px)/5.5)] lg:w-[calc((100vw-248px)/6)]"
 >
 <AnimeCard anime={anime} />
 </motion.div>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 onClick={() => slide('right')}
 className="absolute right-0 top-0 bottom-0 z-40 bg-white/10 w-12 hidden md:group-hover/arrows:flex items-center justify-center text-h2 hover:bg-neutral-900/90 transition-all text-white"
 >
 <BoxyChevron direction="right" size={32} />
 </button>
 </div>
 </div>
 );
});

export default AnimeRow;
