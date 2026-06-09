import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import AnimeCard from '../components/anime/AnimeCard';
import SkeletonCard from '../components/skeletons/SkeletonCard';
import { BoxySearch } from '../components/ui/BoxyIcons';
import { Helmet } from 'react-helmet-async';

// OPTIMIZATION: Cache the anime list to prevent redundant database reads during search
// Cache expires after 5 minutes to ensure fresh data
let cachedAnimeList = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

const Search = () => {
 const [searchParams] = useSearchParams();
 const q = searchParams.get('q')?.toLowerCase() || '';
 const [results, setResults] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchAndFilter = async () => {
 try {
 if (!cachedAnimeList || Date.now() - cacheTimestamp > CACHE_TTL) {
 setLoading(true);
 const animeRef = query(collection(db, 'anime'), limit(2000));
 const snapshot = await getDocs(animeRef);
 cachedAnimeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 cacheTimestamp = Date.now();
 }

 const filtered = cachedAnimeList.filter(anime =>
 anime.title?.toLowerCase().includes(q) ||
 anime.description?.toLowerCase().includes(q) ||
 anime.genres?.some(g => g.toLowerCase().includes(q))
 );

 setResults(filtered);
 } catch (err) {
 console.error("Search error:", err);
 } finally {
 setLoading(false);
 }
 };

 if (q) {
 fetchAndFilter();
 } else {
 setResults([]);
 setLoading(false);
 }
 }, [q]);

 return (
 <div className="min-h-screen bg-transparent pt-24 md:pt-32 pb-20 px-4 md:px-16">
 <Helmet>
 <title>{`Search: ${q} | NeonToad`}</title>
 </Helmet>
 <div className="mb-12">
 {q ? (
 <>
 <h1 className="text-h2 md:text-h1 font-medium text-white/90 tracking-tight mb-4">
 Results for <span className="text-white">"{q}"</span>
 </h1>
 <p className="text-white/90 font-medium text-micro tracking-tight">
 {loading ? 'Searching NeonToad database...' : `${results.length} Titles found`}
 </p>
 </>
 ) : (
 <h1 className="text-h2 md:text-h1 font-medium text-white tracking-tight mb-4">Search</h1>
 )}
 </div>

 {!q ? (
 <div className="flex flex-col items-center justify-center py-32 text-white/90 gap-6">
 <BoxySearch size={80} className="opacity-10" />
 <div className="text-center">
 <h2 className="text-h3 font-medium text-white/90 mb-2 tracking-tight">Search NeonToad</h2>
 <p className="text-micro font-medium max-w-xs mx-auto tracking-tight">Type a title, genre, or keyword in the search bar above.</p>
 </div>
 </div>
 ) : loading ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
 </div>
 ) : results.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 {results.map((anime) => (
 <AnimeCard key={anime.id} anime={anime} />
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-20 text-white/90 gap-6">
 <BoxySearch size={80} className="opacity-10" />
 <div className="text-center">
 <h2 className="text-h3 font-medium text-white/90 mb-2 tracking-tight">No results found</h2>
 <p className="text-micro font-medium max-w-xs mx-auto tracking-tight">Try searching for something else or browse our full library.</p>
 </div>
 </div>
 )}
 </div>
 );
};

export default Search;
