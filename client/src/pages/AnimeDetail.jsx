import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const ReactPlayer = lazy(() => import('react-player'));
import { BoxyPlay, BoxyPlus, BoxyStar, BoxyChevron, BoxyThumbsUp, BoxyThumbsDown, BoxyHeart, BoxyBookmark, BoxyShare } from '../components/ui/BoxyIcons';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, increment, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import PageLoader from '../components/ui/PageLoader';
import EmptyState from '../components/ui/EmptyState';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AnimeRow from '../components/anime/AnimeRow';
import AddToListModal from '../components/anime/AddToListModal';


const AnimeDetail = () => {
 const { activeProfile, user, toggleFavorite, isBanned } = useAuth();
 const { id } = useParams();
 const navigate = useNavigate();
 const [anime, setAnime] = useState(null);
 const [episodes, setEpisodes] = useState([]);
 const [similarAnime, setSimilarAnime] = useState([]);
 const [loading, setLoading] = useState(true);
 const [selectedSeason, setSelectedSeason] = useState(1);
 const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const [isNavigating, setIsNavigating] = useState(false);
 const [isListModalOpen, setIsListModalOpen] = useState(false);

 const [liked, setLiked] = useState(false);
 const [disliked, setDisliked] = useState(false);
 const [likesCount, setLikesCount] = useState(0);
 const [dislikesCount, setDislikesCount] = useState(0);
 const [isFavorite, setIsFavorite] = useState(false);

 useEffect(() => {
 if (activeProfile && anime) {
 setIsFavorite(activeProfile.favorites?.some(f => f.id === anime.id));
 }
 }, [activeProfile, anime]);

 useEffect(() => {
 if (user && anime) {
 setLiked(anime.likedBy?.includes(user.uid) || false);
 setDisliked(anime.dislikedBy?.includes(user.uid) || false);
 }
 }, [user, anime]);

 const handleLike = async () => {
 if (!user) { toast.error('Please login to like!'); return; }
 if (isBanned) { toast.error('You are banned from performing this action.'); return; }
 const animeRef = doc(db, 'anime', String(anime.id));
 try {
 if (liked) {
 setLiked(false); setLikesCount(prev => prev - 1);
 await updateDoc(animeRef, { likedBy: arrayRemove(user.uid), likes: increment(-1) });
 } else {
 setLiked(true); setLikesCount(prev => prev + 1);
 const updates = { likedBy: arrayUnion(user.uid), likes: increment(1) };
 if (disliked) {
 setDisliked(false); setDislikesCount(prev => prev - 1);
 updates.dislikedBy = arrayRemove(user.uid);
 updates.dislikes = increment(-1);
 }
 await updateDoc(animeRef, updates);
 }
 } catch (err) { toast.error("Error liking:" + err.message); }
 };

 const handleDislike = async () => {
 if (!user) { toast.error('Please login to dislike!'); return; }
 if (isBanned) { toast.error('You are banned from performing this action.'); return; }
 const animeRef = doc(db, 'anime', String(anime.id));
 try {
 if (disliked) {
 setDisliked(false); setDislikesCount(prev => prev - 1);
 await updateDoc(animeRef, { dislikedBy: arrayRemove(user.uid), dislikes: increment(-1) });
 } else {
 setDisliked(true); setDislikesCount(prev => prev + 1);
 const updates = { dislikedBy: arrayUnion(user.uid), dislikes: increment(1) };
 if (liked) {
 setLiked(false); setLikesCount(prev => prev - 1);
 updates.likedBy = arrayRemove(user.uid);
 updates.likes = increment(-1);
 }
 await updateDoc(animeRef, updates);
 }
 } catch (err) { toast.error("Error disliking:" + err.message); }
 };

 const handleFavorite = async () => {
 if (!user) { toast.error('Please login to favorite!'); return; }
 await toggleFavorite(anime);
 toast.success(isFavorite ? 'Removed from your list' : 'Added to your list');
 };

 const handleShare = () => {
 navigator.clipboard.writeText(window.location.href);
 toast.success('Link copied to clipboard');
 };

 const handlePlus = () => {
 if (!user) { toast.error('Please login to create lists!'); return; }
 setIsListModalOpen(true);
 };

 useEffect(() => {
 const fetchDetails = async () => {

 try {
 const animeDoc = await getDoc(doc(db, 'anime', id));
 let animeData = null;
 if (animeDoc.exists()) {
 animeData = { id: animeDoc.id, ...animeDoc.data() };
 setAnime(animeData);
 setLikesCount(animeData.likes || 0);
 setDislikesCount(animeData.dislikes || 0);
 if (auth.currentUser) {
 setLiked(animeData.likedBy?.includes(auth.currentUser.uid));
 setDisliked(animeData.dislikedBy?.includes(auth.currentUser.uid));
 }
 } else {
 setAnime(null);
 }

 let q = query(collection(db, 'episodes'), where('animeId', '==', id));
 let querySnapshot = await getDocs(q);
 
 // Fallback: If no episodes found, try checking for animeId as a number 
 if (querySnapshot.empty && !isNaN(Number(id))) {
 q = query(collection(db, 'episodes'), where('animeId', '==', Number(id)));
 querySnapshot = await getDocs(q);
 }
 
 const rawEpData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 
 // Auto-Release Filter
 const now = new Date();
 const epData = rawEpData.filter(ep => {
 if (ep.status !== 'queued') return true;
 if (!ep.releaseDate) return false;
 return ep.releaseDate.toDate() <= now;
 });

 // Manually sort by episodeNumber asc to avoid Firebase composite index requirement
 epData.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
 setEpisodes(epData);

 // Fetch Similar Anime
 if (animeData?.genres?.length > 0) {
 const similarQuery = query(collection(db, 'anime'), where('genres', 'array-contains', animeData.genres[0]), limit(15));
 const similarSnap = await getDocs(similarQuery);
 const similarFetched = similarSnap.docs
 .map(d => ({ id: d.id, ...d.data() }))
 .filter(a => a.id !== animeData.id);
 setSimilarAnime(similarFetched);
 }


 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 fetchDetails();
 window.scrollTo(0, 0);
 }, [id]);

 if (loading) return <PageLoader />;

 if (!anime) {
 return (
 <div className="pt-24 md:pt-32 min-h-screen bg-transparent">
 <Helmet><title>Anime Not Found | NeonToad</title></Helmet>
 <EmptyState message="Anime not found in database" />
 </div>
 );
 }

 return (
 <div className="bg-transparent min-h-screen">
 <Helmet>
 <title>{`${anime.title} | NeonToad Anime`}</title>
 <meta name="description" content={anime.description} />
 </Helmet>
 {/* Banner Section */}
 <div className="relative min-h-[40vh] md:min-h-[60vh] w-full flex flex-col justify-end">
 <div className="absolute inset-0 overflow-hidden bg-transparent">
 {(() => {
 const displayVideo = anime.bannerVideo;
 const displayImage = anime.bannerImage || anime.image;

 return displayVideo ? (
 <Suspense fallback={null}>
 <ReactPlayer
 url={displayVideo}
 playing={true}
 loop={true}
 muted={true}
 width="100%"
 height="140%"
 style={{ position: 'absolute', top: '-20%', left: 0, opacity: 0.8, pointerEvents: 'none' }}
 config={{
 youtube: {
 playerVars: { showinfo: 0, controls: 0, autohide: 1, modestbranding: 1 }
 }
 }}
 />
 </Suspense>
 ) : (
 <img loading="lazy"
 src={displayImage}
 alt=""
 className="w-full h-full object-cover opacity-80"
 />
 );
 })()}
 <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
 <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent pointer-events-none" />
 <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />
 </div>

 <div className="relative w-full px-6 md:px-16 pt-28 md:pt-64 pb-12 md:pb-32 z-10">
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 className="max-w-4xl"
 >

 <h1 className="text-h2 md:text-h1 font-medium text-white mb-8 drop-shadow-2xl leading-none">{anime.title}</h1>
 <div className="flex flex-wrap items-center gap-3 my-8">
 <button
 disabled={isNavigating}
 onClick={() => {
 setIsNavigating(true);
 // Give React a tick to render the loading state before synchronous navigation blocks the thread
 setTimeout(() => {
 const historyItem = activeProfile?.watchHistory?.find(h => String(h.animeId) === String(anime.id));
 if (historyItem) {
 navigate(`/watch/${historyItem.episodeId}?t=${Math.floor(historyItem.time)}`);
 } else if (episodes && episodes.length > 0) {
 const firstEp = [...episodes].sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))[0];
 navigate(`/watch/${firstEp.id}`);
 } else {
 navigate(`/watch/${anime.id}`);
 }
 }, 0);
 }}
 className="w-full sm:w-auto btn-accent h-12 text-body active:scale-95 shadow-[0_0_20px_rgba(134,233,92,0.2)] disabled:opacity-70 disabled:cursor-wait"
 >
 {isNavigating ? (
 <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
 ) : (
 <><BoxyPlay size={18} /> Play</>
 )}
 </button>
 
 <button 
 onClick={handleFavorite} 
 className="bg-white/10 backdrop-blur-md rounded-full text-white h-12 w-12 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center shadow-lg"
 title={isFavorite ?"Remove from List" :"Add to List"}
 >
 <BoxyBookmark size={18} className={isFavorite ? 'fill-primary text-primary' : ''} />
 </button>
 
 <button 
 onClick={handlePlus} 
 className="bg-white/10 backdrop-blur-md rounded-full text-white h-12 w-12 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center shadow-lg"
 title="Add to Custom List"
 >
 <BoxyPlus size={22} />
 </button>
 
 <button 
 onClick={handleShare} 
 className="bg-white/10 backdrop-blur-md rounded-full text-white h-12 w-12 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center shadow-lg"
 title="Share"
 >
 <BoxyShare size={18} />
 </button>
 </div>

 <div className="mt-8 flex flex-wrap items-center gap-4">
 <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-3 py-1 rounded-xl">
 <BoxyStar className="text-white" size={14} fill="currentColor" />
 <span className="text-white text-micro font-medium">{anime.rating || '0.0'} Score</span>
 </div>
 <div className="flex items-center gap-4 text-micro font-medium text-white">
 <span>{likesCount} Likes</span>
 <span>•</span>
 <span>{dislikesCount} Dislikes</span>
 <span>•</span>
 <span>{anime.genres?.[0] || 'Action'}</span>
 </div>
 </div>

 <div className="mt-8 space-y-4 max-w-2xl">
 <div className="relative">
 <p className={`text-white leading-relaxed text-body font-medium transition-all ${!isExpanded ? 'line-clamp-2' : ''}`}>
 {anime.description}
 </p>
 {anime.description?.length > 150 && (
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="text-white hover:text-white font-semibold text-micro mt-2 flex items-center gap-2 transition-colors hover: pb-0.5 max-w-max"
 >
 {isExpanded ? 'Read less' : 'Read more'}
 </button>
 )}
 </div>
 </div>
 </motion.div>
 </div>
 </div>

 {/* Main Content */}
 <div className="mt-4 md:mt-8 px-6 md:px-16 pb-16 relative z-20">
 <div className="flex flex-col lg:flex-row gap-8 lg:-mt-16">

 {/* Right: Info & Episodes */}
 <div className="flex-grow space-y-4 min-w-0 lg:pt-1">
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
 <h2 className="text-h3 font-semibold text-white flex items-center gap-3 leading-none">
 Episodes
 </h2>
 <div className="relative group w-full sm:w-auto flex items-center">
 {(() => {
 const availableSeasons = [...new Set(episodes.map(ep => Number(ep.season || 1)))].sort();
 if (availableSeasons.length === 0) availableSeasons.push(1);
 return (
 <>
 <button
 onClick={() => availableSeasons.length > 1 && setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
 className={`w-full sm:w-auto bg-transparent border-none py-1 rounded-xl font-semibold transition-all text-h3 text-white outline-none text-left flex items-center gap-3 ${availableSeasons.length > 1 ? 'hover:text-white cursor-pointer' : 'cursor-default'}`}
 >
 Season {selectedSeason}
 {availableSeasons.length > 1 && (
 <BoxyChevron direction={isSeasonDropdownOpen ?"up" :"down"} size={16} className="pointer-events-none text-white group-hover:text-white transition-colors" />
 )}
 </button>
 {isSeasonDropdownOpen && availableSeasons.length > 1 && (
 <motion.div
 initial={{ opacity: 0, y: -5 }}
 animate={{ opacity: 1, y: 0 }}
 className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 w-48 bg-[#0a0a0a] z-50 shadow-2xl p-2 flex flex-col gap-1 rounded-xl glass-card"
 >
 {availableSeasons.map(season => (
 <button
 key={season}
 onClick={() => {
 setSelectedSeason(season);
 setIsSeasonDropdownOpen(false);
 }}
 className={`text-left px-4 py-3 text-body font-medium transition-colors ${selectedSeason === season ? 'bg-white/10 backdrop-blur-md rounded-xl text-white' : 'text-white hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:text-white'}`}
 >
 Season {season}
 </button>
 ))}
 </motion.div>
 )}
 </>
 );
 })()}
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 pt-4">
 {episodes.filter(ep => Number(ep.season || 1) === selectedSeason).length > 0 ?
 episodes.filter(ep => Number(ep.season || 1) === selectedSeason).map((ep) => {
 const history = activeProfile?.watchHistory?.find(h => h.episodeId === ep.id);
 const progress = history ? (history.time / history.duration) * 100 : 0;
 
 return (
 <motion.div
 key={ep.id}
 onClick={() => {
 setIsNavigating(true);
 setTimeout(() => {
 navigate(`/watch/${ep.id}${history ? `?t=${Math.floor(history.time)}` : ''}`);
 }, 0);
 }}
 className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 group cursor-pointer border-t border-white/10 p-4 md:p-6 hover:bg-white/10 backdrop-blur-md rounded-xl transition-colors rounded-xl"
 >
 {/* Episode Number */}
 <div className="hidden md:flex flex-shrink-0 w-8 md:w-12 justify-center items-center text-h2 font-medium text-netflixLight group-hover:text-white transition-colors">
 {ep.episodeNumber}
 </div>

 <div className="relative w-full md:w-48 lg:w-56 flex-shrink-0 aspect-video bg-white/5 backdrop-blur-md border border-white/10 rounded-none overflow-hidden shadow-xl">
 <img loading="lazy" src={ep.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700" />
 <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 {isNavigating ? (
 <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
 ) : (
 <BoxyPlay fill="white" size={40} />
 )}
 </div>
 {progress > 0 && (
 <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-700 z-40">
 <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
 </div>
 )}
 </div>
 
 <div className="flex flex-col justify-center flex-grow min-w-0 md:py-2">
 <div className="flex items-start justify-between gap-4 mb-1 md:mb-2">
 <h3 className="text-[15px] md:text-[16px] font-medium text-white leading-tight group-hover:text-white transition-colors">{ep.title || `Episode ${ep.episodeNumber}`}</h3>
 <span className="text-[13px] md:text-[14px] font-semibold text-white flex-shrink-0">{ep.duration || '24m'}</span>
 </div>
 {ep.description && (
 <p className="text-[12px] md:text-[13px] text-netflixLight leading-relaxed line-clamp-3 md:line-clamp-2 font-medium">
 {ep.description}
 </p>
 )}
 </div>
 </motion.div>
 )}) : (
 <EmptyState message="No episodes available yet" />
 )}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* More Like This */}
 {similarAnime.length > 0 && (
 <div className="mt-20">
 <AnimeRow title="More Like This" data={similarAnime} />
 </div>
 )}
 {/* Modals */}
 <AddToListModal
 isOpen={isListModalOpen}
 onClose={() => setIsListModalOpen(false)}
 anime={anime}
 />
 </div>
 );
};

export default AnimeDetail;
