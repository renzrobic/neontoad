import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import AnimeCard from '../components/anime/AnimeCard';
import SkeletonCard from '../components/skeletons/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

let libraryCache = {}; // { [genre]: { list: [], lastVisible: null, hasMore: true, timestamp: number } }

const Library = () => {
 const [searchParams, setSearchParams] = useSearchParams();
 const initialGenre = searchParams.get('genre') || 'All';

 const [activeGenre, setActiveGenre] = useState(initialGenre);
 const [animeList, setAnimeList] = useState([]);
 const [loading, setLoading] = useState(true);
 const [loadingMore, setLoadingMore] = useState(false);
 const [lastVisible, setLastVisible] = useState(null);
 const [hasMore, setHasMore] = useState(true);

 const observerRef = useRef(null);

 const genres = ['All', 'Action', 'Adventure', 'Drama', 'Fantasy', 'Sci-Fi', 'Comedy', 'Romance', 'Slice of Life', 'Supernatural'];

 const fetchAnime = async (genre, isLoadMore = false) => {
 if (isLoadMore && (!hasMore || loadingMore)) return;

 if (isLoadMore) {
 setLoadingMore(true);
 } else {
 if (libraryCache[genre] && (Date.now() - libraryCache[genre].timestamp < 5 * 60 * 1000)) {
 setAnimeList(libraryCache[genre].list);
 setLastVisible(libraryCache[genre].lastVisible);
 setHasMore(libraryCache[genre].hasMore);
 setLoading(false);
 return;
 }
 setLoading(true);
 setAnimeList([]);
 setLastVisible(null);
 setHasMore(true);
 }

 try {
 let q;
 let constraints = [limit(24)]; // Fetch 24 items per page

 // We rely on implicit document ID ordering to avoid requiring a composite index 
 // for every genre combination when filtering with array-contains.

 if (genre !== 'All') {
 constraints.push(where('genres', 'array-contains', genre));
 }

 if (isLoadMore && lastVisible) {
 constraints.push(startAfter(lastVisible));
 }

 q = query(collection(db, 'anime'), ...constraints);
 const snapshot = await getDocs(q);

 const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

 if (snapshot.docs.length > 0) {
 setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
 }

 if (newDocs.length < 24) {
 setHasMore(false);
 }

 // To prevent duplication in UI if rapid requests happen
 if (isLoadMore) {
 setAnimeList(prev => {
 const existingIds = new Set(prev.map(a => a.id));
 const uniqueNewDocs = newDocs.filter(d => !existingIds.has(d.id));
 const newList = [...prev, ...uniqueNewDocs];
 libraryCache[genre] = { list: newList, lastVisible: snapshot.docs[snapshot.docs.length - 1] || lastVisible, hasMore: newDocs.length >= 24, timestamp: Date.now() };
 return newList;
 });
 } else {
 setAnimeList(newDocs);
 libraryCache[genre] = { list: newDocs, lastVisible: snapshot.docs[snapshot.docs.length - 1] || null, hasMore: newDocs.length >= 24, timestamp: Date.now() };
 }
 } catch (error) {
 console.error("Error fetching library data:", error);
 } finally {
 setLoading(false);
 setLoadingMore(false);
 }
 };

 // Initial fetch when genre changes
 useEffect(() => {
 fetchAnime(activeGenre, false);
 // Update URL without reloading
 if (activeGenre === 'All') {
 searchParams.delete('genre');
 } else {
 searchParams.set('genre', activeGenre);
 }
 setSearchParams(searchParams, { replace: true });
 }, [activeGenre]);

 // Intersection Observer for Infinite Scroll
 const handleObserver = useCallback((entries) => {
 const target = entries[0];
 if (target.isIntersecting && hasMore && !loading && !loadingMore) {
 fetchAnime(activeGenre, true);
 }
 }, [hasMore, loading, loadingMore, activeGenre, lastVisible]);

 useEffect(() => {
 const option = {
 root: null,
 rootMargin:"200px",
 threshold: 0
 };
 const observer = new IntersectionObserver(handleObserver, option);
 if (observerRef.current) observer.observe(observerRef.current);

 return () => {
 if (observerRef.current) observer.unobserve(observerRef.current);
 };
 }, [handleObserver]);

 return (
 <div className="pt-24 min-h-screen bg-transparent px-4 md:px-16 pb-20">
 <Helmet>
 <title>{`Full Library - ${activeGenre} | NeonToad`}</title>
 <meta name="description" content="Browse the entire NeonToad anime library." />
 </Helmet>
 <div className="mb-6">
 <h1 className="text-h3 md:text-h2 font-medium text-white tracking-tight mb-4">Full Library</h1>

 {/* Genre Filters */}
 <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0 flex-nowrap md:flex-wrap">
 {genres.map(genre => (
 <button
 key={genre}
 onClick={() => setActiveGenre(genre)}
 className={`px-6 py-2.5 text-[13px] font-bold tracking-widest uppercase transition-all flex-shrink-0 backdrop-blur-md ${activeGenre === genre
 ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] border-white'
 : 'bg-neutral-900 text-white/90 hover:text-white hover:bg-neutral-800 shadow-xl'
 }`}
 >
 {genre}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 <AnimatePresence mode="popLayout">
 {animeList.map((anime) => (
 <motion.div
 key={anime.id}
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 transition={{ duration: 0.2 }}
 >
 <AnimeCard anime={anime} />
 </motion.div>
 ))}

 {/* Initial Loading Skeletons */}
 {loading && [...Array(12)].map((_, i) => (
 <motion.div
 key={`skeleton-${i}`}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 >
 <SkeletonCard />
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 {/* Load More Skeletons & Intersection Observer Target */}
 <div ref={observerRef} className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 {loadingMore && [...Array(6)].map((_, i) => (
 <div key={`more-skeleton-${i}`}>
 <SkeletonCard />
 </div>
 ))}
 </div>

 {!hasMore && !loading && animeList.length > 0 && (
 <div className="text-center mt-12 py-8">
 <p className="text-white/90 font-medium text-micro mx-auto">End of results</p>
 </div>
 )}

 {!loading && animeList.length === 0 && (
 <div className="flex flex-col items-center justify-center py-32 text-white/90 gap-6">
 <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter" className="opacity-10"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
 <div className="text-center">
 <h2 className="text-h3 font-medium text-white/90 mb-2 tracking-tight">No anime found</h2>
 <p className="text-micro font-medium max-w-xs mx-auto tracking-tight">We couldn't find any anime in this category.</p>
 </div>
 </div>
 )}
 </div>
 );
};

export default Library;
