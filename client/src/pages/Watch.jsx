import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SkeletonWatch from '../components/skeletons/SkeletonWatch';
import VideoEmbed from '../components/VideoEmbed';
import { BoxyPlay, BoxyInfo, BoxyMessage, BoxyChevron, BoxyList, BoxyShare, BoxyAlert, BoxyMaximize, BoxyMinimize, BoxyX, BoxyTV } from '../components/ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';

const Watch = () => {
 const { episodeId } = useParams(); // This could be an Episode ID or an Anime ID
 const navigate = useNavigate();
 const location = useLocation();
 const searchParams = new URLSearchParams(location.search);
 const initialTime = parseFloat(searchParams.get('t')) || 0;
 const [episode, setEpisode] = useState(null);
 const [anime, setAnime] = useState(null);
 const [otherEpisodes, setOtherEpisodes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showDrawer, setShowDrawer] = useState(false);
 const [isFauxFullscreen, setIsFauxFullscreen] = useState(false);
 const [isIOS, setIsIOS] = useState(false);
 const [isMobile, setIsMobile] = useState(false);
 const { updateWatchProgress, activeProfile, user } = useAuth();
 const [streamBlocked, setStreamBlocked] = useState(false);
 const [skipTimes, setSkipTimes] = useState(null);
 const progressRef = React.useRef({ time: 0, duration: 0 });

 useEffect(() => {
 const userAgent = navigator.userAgent;
 const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
 const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || isIOSDevice;
 
 setIsIOS(isIOSDevice);
 setIsMobile(isMobileDevice);
 }, []);

 useEffect(() => {
 const handleFullscreenChange = () => {
 if (!document.fullscreenElement && !document.webkitFullscreenElement) {
 setIsFauxFullscreen(false);
 if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
 window.screen.orientation.unlock();
 }
 } else {
 setIsFauxFullscreen(true);
 }
 };

 document.addEventListener('fullscreenchange', handleFullscreenChange);
 document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

 return () => {
 document.removeEventListener('fullscreenchange', handleFullscreenChange);
 document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
 };
 }, []);

 // Concurrent Stream Tracking
 useEffect(() => {
 if (!activeProfile || !user) return;
 
 let intervalId;
 let isComponentMounted = true;
 const deviceId = localStorage.getItem('deviceId');
 if (!deviceId) return;

 const profileIdentifier = activeProfile.id || activeProfile.name || 'default';
 const streamRef = doc(db, 'activeStreams', profileIdentifier);

 const checkAndClaimStream = async () => {
 try {
 const streamSnap = await getDoc(streamRef);
 
 if (streamSnap.exists()) {
 const data = streamSnap.data();
 const lastPingTime = data.lastPing?.toMillis() || 0;
 const timeSinceLastPing = Date.now() - lastPingTime;
 
 // If the profile is active on another device and pinged within the last 20 seconds
 if (data.deviceId !== deviceId && timeSinceLastPing < 20000) {
 if (isComponentMounted) setStreamBlocked(true);
 return;
 }
 }
 
 // Claim the stream
 await setDoc(streamRef, {
 deviceId,
 lastPing: serverTimestamp()
 });
 
 // Start heartbeat
 intervalId = setInterval(async () => {
 try {
 await setDoc(streamRef, {
 deviceId,
 lastPing: serverTimestamp()
 });
 } catch (e) {
 console.error("Failed to update heartbeat:", e);
 }
 }, 10000);
 
 } catch (err) {
 console.error("Stream tracking error:", err);
 }
 };

 checkAndClaimStream();

 return () => {
 isComponentMounted = false;
 if (intervalId) clearInterval(intervalId);
 // Clean up stream claim if this device is the one holding it
 getDoc(streamRef).then((snap) => {
 if (snap.exists() && snap.data().deviceId === deviceId) {
 deleteDoc(streamRef);
 }
 });
 };
 }, [activeProfile, user]);

 const toggleFullscreen = async () => {
 try {
 const elem = document.documentElement;
 const isNativeSupported = !!(elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen);

 if (isNativeSupported) {
 if (!document.fullscreenElement) {
 if (elem.requestFullscreen) {
 await elem.requestFullscreen();
 } else if (elem.webkitRequestFullscreen) { /* Safari */
 await elem.webkitRequestFullscreen();
 } else if (elem.msRequestFullscreen) { /* IE11 */
 await elem.msRequestFullscreen();
 }
 
 // Try to lock orientation to landscape
 if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
 try {
 await window.screen.orientation.lock('landscape');
 } catch (e) {
 // Silently fail if not supported
 }
 }
 setIsFauxFullscreen(true);
 } else {
 if (document.exitFullscreen) {
 await document.exitFullscreen();
 } else if (document.webkitExitFullscreen) { /* Safari */
 await document.webkitExitFullscreen();
 } else if (document.msExitFullscreen) { /* IE11 */
 await document.msExitFullscreen();
 }
 
 if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
 window.screen.orientation.unlock();
 }
 setIsFauxFullscreen(false);
 }
 } else {
 // Fallback for iOS iPhone where document fullscreen is not supported
 const videoElem = document.querySelector('video');
 if (videoElem && videoElem.webkitEnterFullscreen) {
 videoElem.webkitEnterFullscreen();
 } else {
 // Absolute fallback
 setIsFauxFullscreen(!isFauxFullscreen);
 }
 }
 } catch (err) {
 console.error("Fullscreen error:", err);
 // Fallback if native throws an error
 const videoElem = document.querySelector('video');
 if (videoElem && videoElem.webkitEnterFullscreen) {
 videoElem.webkitEnterFullscreen();
 } else {
 setIsFauxFullscreen(!isFauxFullscreen);
 }
 }
 };

 // Save progress on unmount or episode change
 useEffect(() => {
 return () => {
 if (progressRef.current.time > 5 && episode && anime) {
 updateWatchProgress(anime, episode, progressRef.current.time, progressRef.current.duration);
 }
 };
 }, [episode, anime, updateWatchProgress]);

 useEffect(() => {
 if (!anime || !episode) {
 setSkipTimes(null);
 return;
 }
 const fetchSkipData = async () => {
 try {
 const res = await fetch(`https://api.aniskip.com/v2/skip-times/${anime.id}/${episode.episodeNumber}?types=op&types=ed&episodeLength=0`);
 const data = await res.json();
 if (data.found && data.results) {
 const skipData = {};
 data.results.forEach(result => {
 skipData[result.skipType] = result.interval;
 });
 setSkipTimes(skipData);
 } else {
 setSkipTimes(null);
 }
 } catch (err) {
 console.error("Failed to fetch skip times:", err);
 setSkipTimes(null);
 }
 };
 fetchSkipData();
 }, [anime, episode]);

 useEffect(() => {
 let isRedirecting = false;
 const fetchData = async () => {

 // OPTIMIZATION: Seamless transition. If the next episode is already in our list, skip DB fetch!
 const foundEp = otherEpisodes.find(ep => String(ep.id) === String(episodeId));
 if (foundEp && anime) {
 setEpisode(foundEp);
 progressRef.current = { time: 0, duration: 0 };
 window.scrollTo(0, 0);
 // Seamless transition. If the next episode is already in our list, skip DB fetch!
 return;
 }

 setLoading(true);
 progressRef.current = { time: 0, duration: 0 }; // Reset progress for the new episode
 try {
 // 1. Try to find if this ID is an Anime first (common for"Watch Now" buttons)
 const animeDoc = await getDoc(doc(db, 'anime', episodeId));
 let targetAnimeId = episodeId;
 let currentEpisodeData = null;
 let fetchedAnimeData = null;

 if (animeDoc.exists()) {
 const animeData = { id: animeDoc.id, ...animeDoc.data() };
 fetchedAnimeData = animeData;
 setAnime(animeData);
 targetAnimeId = animeData.id;

 // 1a. Check if there is watch history for this anime
 const historyItem = activeProfile?.watchHistory?.find(
 (h) => String(h.animeId) === String(targetAnimeId)
 );

 if (historyItem && String(historyItem.episodeId) !== String(episodeId) && !location.state?.fromReel) {
 const historyEpDoc = await getDoc(doc(db, 'episodes', String(historyItem.episodeId)));
 if (historyEpDoc.exists()) {
 isRedirecting = true;
 navigate(`/watch/${historyItem.episodeId}?t=${Math.floor(historyItem.time)}`, { replace: true });
 return;
 }
 }

 // 1b. Fetch all actual episodes for this anime to play Episode 1
 let q = query(collection(db, 'episodes'), where('animeId', '==', targetAnimeId));
 let querySnapshot = await getDocs(q);
 
 if (querySnapshot.empty && !isNaN(Number(targetAnimeId))) {
 q = query(collection(db, 'episodes'), where('animeId', '==', Number(targetAnimeId)));
 querySnapshot = await getDocs(q);
 }

 const rawEps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 const now = new Date();
 const eps = rawEps.filter(ep => {
 if (ep.status !== 'queued') return true;
 if (!ep.releaseDate) return false;
 return ep.releaseDate.toDate() <= now;
 });
 eps.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
 
 if (eps.length > 0) {
 if (String(eps[0].id) !== String(episodeId)) {
 isRedirecting = true;
 navigate(`/watch/${eps[0].id}`, { replace: true });
 return;
 } else {
 currentEpisodeData = eps[0];
 }
 } else {
 // If there are absolutely no episodes, and we came from a reel, take them to the anime details page
 if (location.state?.fromReel) {
 isRedirecting = true;
 navigate(`/anime/${targetAnimeId}`, { replace: true });
 return;
 }

 // Fallback to default mock Episode 1 only if there are absolutely no episodes in the database
 currentEpisodeData = {
 id: `default-${targetAnimeId}`,
 animeId: targetAnimeId,
 episodeNumber: 1,
 title: 'Episode 1',
 embedUrl: '',
 thumbnail: animeData.image
 };
 }
 
 // Set other episodes right here from our first query
 setOtherEpisodes(eps);
 
 } else {
 // 2. If not an anime, try to find it as an Episode
 const epDoc = await getDoc(doc(db, 'episodes', episodeId));
 if (epDoc.exists()) {
 currentEpisodeData = { id: epDoc.id, ...epDoc.data() };
 targetAnimeId = String(currentEpisodeData.animeId);

 const aDoc = await getDoc(doc(db, 'anime', targetAnimeId));
 if (aDoc.exists()) {
 fetchedAnimeData = { id: aDoc.id, ...aDoc.data() };
 setAnime(fetchedAnimeData);
 }
 }
 }

 // Final fallback if nothing found
 if (!currentEpisodeData) {
 setEpisode(null);
 } else {
 setEpisode(currentEpisodeData);

 // Track a view for this anime
 try {
 await updateDoc(doc(db, 'anime', String(targetAnimeId)), {
 viewCount: increment(1)
 });
 } catch (err) {
 console.warn("Could not increment view tracking:", err);
 }
 }

 // If we didn't fetch episodes in step 1, fetch them now
 if (!otherEpisodes.length && targetAnimeId) {
 let q = query(collection(db, 'episodes'), where('animeId', '==', targetAnimeId));
 let querySnapshot = await getDocs(q);
 
 if (querySnapshot.empty && !isNaN(Number(targetAnimeId))) {
 q = query(collection(db, 'episodes'), where('animeId', '==', Number(targetAnimeId)));
 querySnapshot = await getDocs(q);
 }
 
 const rawAllEps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 const now = new Date();
 const allEps = rawAllEps.filter(ep => {
 if (ep.status !== 'queued') return true;
 if (!ep.releaseDate) return false;
 return ep.releaseDate.toDate() <= now;
 });
 allEps.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
 
 setOtherEpisodes(allEps);
 }
 

 } catch (err) {
 console.error("Watch Page Error:", err);
 } finally {
 if (!isRedirecting) {
 setLoading(false);
 }
 }
 };

 fetchData();
 window.scrollTo(0, 0);
 }, [episodeId, navigate]);

 if (streamBlocked) {
 return (
  <div className="pt-24 md:pt-32 min-h-screen bg-transparent flex flex-col md:flex-row items-center justify-center text-center md:text-left px-4 gap-12 max-w-4xl mx-auto">
  <Helmet><title>Profile in Use | NeonToad</title></Helmet>

  {/* Mascot Placeholder */}
  <div className="w-64 h-64 md:w-80 md:h-80 bg-white/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-white/10 flex-shrink-0 relative overflow-hidden group">
  <img 
  src="/images/mascots/toady-limit.svg" 
  alt="Toady Mascot - Screen Limit" 
  className="absolute inset-0 w-full h-full object-contain z-10 transition-opacity"
  onError={(e) => e.target.style.opacity = 0}
  />
  <div className="text-white/30 text-center px-4 absolute inset-0 flex flex-col items-center justify-center -z-0">
  <BoxyTV size={48} className="mx-auto mb-2 opacity-50" />
  <p className="text-micro font-bold tracking-widest uppercase">Toady Mascot</p>
  <p className="text-[10px] mt-1">/images/mascots/toady-limit.svg</p>
  </div>
  </div>

  {/* Text Content */}
  <div className="max-w-md w-full flex flex-col items-center md:items-start">
  <h2 className="text-h3 md:text-h2 font-bold text-white/90 mb-4 tracking-tight">Screen limit reached</h2>
  <p className="text-white/50 mb-10 leading-relaxed text-micro md:text-[15px] font-normal tracking-tight">
  This profile is currently streaming on another device. Please stop playback there, or switch to a different profile.
  </p>
  <div className="flex flex-col gap-3 w-full">
  <button 
  onClick={() => navigate('/profiles')}
  className="bg-primary text-black font-bold py-4 rounded-full w-full hover:scale-105 active:scale-95 transition-transform tracking-tight text-micro"
  >
  Switch Profile
  </button>
  <button 
  onClick={() => navigate('/')}
  className="bg-transparent border-2 border-white/10 text-white/90 font-bold py-4 rounded-full w-full hover:bg-white/5 active:scale-95 transition-all tracking-tight text-micro"
  >
  Return Home
  </button>
  </div>
  </div>
  </div>
 );
 }

 if (loading) return <PageLoader />;

 if (!episode) {
 return (
 <div className="pt-24 md:pt-32 min-h-screen bg-transparent">
 <Helmet><title>Episode Not Found | NeonToad</title></Helmet>
 <EmptyState message="Episode not found in database" />
 </div>
 );
 }



 return (
 <div className={`h-screen w-full bg-black overflow-hidden relative flex flex-col ${isFauxFullscreen ? 'faux-fullscreen-mobile' : ''}`}>
 <Helmet>
 <title>{`${anime?.title || 'Watch'} - Episode ${episode.episodeNumber} | NeonToad`}</title>
 </Helmet>

 {/* 0. INJECT CSS FOR FAUX FULLSCREEN */}
 <style>{`
 .faux-fullscreen-mobile {
 position: fixed !important;
 top: 0 !important;
 left: 0 !important;
 z-index: 99999 !important;
 background: black !important;
 }
 @media screen and (orientation: portrait) {
 .faux-fullscreen-mobile {
 width: 100dvh !important;
 height: 100dvw !important;
 transform: rotate(90deg) translateY(-100%) !important;
 transform-origin: top left !important;
 }
 }
 @media screen and (orientation: landscape) {
 .faux-fullscreen-mobile {
 width: 100dvw !important;
 height: 100dvh !important;
 transform: none !important;
 }
 }
 `}</style>

 {/* Compute next episode for Netflix-style auto-play */}
 {(() => {
 const currentEpIndex = otherEpisodes.findIndex(ep => ep.id === episode?.id);
 const nextEpisode = currentEpIndex > 0 ? otherEpisodes[currentEpIndex - 1] : null;
 
 const topControls = (
  <div className="p-4 md:p-8 flex items-center justify-between w-full pointer-events-none gap-6">
  <div className="flex items-center gap-4 md:gap-6 pointer-events-auto min-w-0">
  <button 
  onClick={() => navigate(`/anime/${episode.animeId}`)}
  className="w-10 h-10 flex-shrink-0 flex items-center justify-center hover:scale-110 transition-all group drop-shadow-lg"
  >
  <BoxyChevron direction="left" size={32} className="text-white group-hover:text-white/80 transition-colors" />
  </button>
  <div className="flex flex-col gap-0.5 min-w-0 drop-shadow-lg">
  <span className="text-[10px] md:text-micro font-medium text-white/90 tracking-wider uppercase truncate">{anime?.title || 'Series'}</span>
  <h1 className="text-body md:text-h4 font-bold text-white tracking-tight leading-snug md:leading-none line-clamp-2 md:truncate">
  Episode {episode.episodeNumber} <span className="text-white/80 mx-1 md:mx-2 font-normal">—</span> {episode.title}
  </h1>
  </div>
  </div>

  <div className="flex items-center gap-3 md:gap-6 pointer-events-auto flex-shrink-0">
  {nextEpisode && (
  <button 
  onClick={() => navigate(`/watch/${nextEpisode.id}`)}
  className="hidden md:flex items-center gap-2 text-white font-bold hover:text-white/80 transition-all drop-shadow-lg text-micro uppercase tracking-widest"
  >
  <span>Next</span> <BoxyPlay size={18} fill="currentColor" />
  </button>
  )}
  <button 
  onClick={() => setShowDrawer(!showDrawer)}
  className={`w-10 h-10 flex items-center justify-center transition-all hover:scale-110 drop-shadow-lg ${showDrawer ? 'text-white/50' : 'text-white hover:text-white/80'}`}
  >
  <BoxyList size={24} />
  </button>
  <button 
  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }}
  className="hidden md:flex w-10 h-10 items-center justify-center text-white hover:text-white/80 transition-all drop-shadow-lg hover:scale-110"
  >
  <BoxyShare size={22} />
  </button>
  </div>
  </div>
  );

  return (
  <>
  {/* 2. FULLSCREEN PLAYER CONTAINER */}
  <div className="flex-grow w-full h-full relative z-10 bg-darkerSurface">
  <VideoEmbed 
  sourceUrl={episode.videoUrl || episode.embedUrl} 
  isFullscreen={true} 
  nextEpisode={nextEpisode}
  onPlayNext={() => nextEpisode && navigate(`/watch/${nextEpisode.id}`)}
  onProgress={(t, d) => { progressRef.current = { time: t, duration: d }; }}
  initialTime={initialTime}
  skipTimes={skipTimes}
  topControls={topControls}
  />
 </div>

 {/* 3. NEXT EPISODE SIDE DRAWER */}
 <AnimatePresence>
 {showDrawer && (
 <>
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setShowDrawer(false)}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110]"
 />
 <motion.div 
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
 className="absolute top-0 right-0 w-full md:w-[450px] h-full bg-black/60 backdrop-blur-3xl z-[120] shadow-2xl p-8 md:p-12 flex flex-col"
 >
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-h4 font-semibold text-white tracking-tighter">Up next</h2>
 <button onClick={() => setShowDrawer(false)} className="text-white/90 hover:text-white transition-colors"><BoxyX size={20} /></button>
 </div>

 {episode.description && (
 <div className="mb-8 p-4 bg-neutral-900 rounded-none flex-shrink-0">
 <h3 className="text-[10px] font-bold text-white/90 tracking-widest uppercase mb-2">Synopsis</h3>
 <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
 <p className="text-micro text-white/90 leading-relaxed font-medium">{episode.description}</p>
 </div>
 </div>
 )}

 <div className="flex-grow overflow-y-auto pr-2 no-scrollbar space-y-8">
 {otherEpisodes.length > 0 ? otherEpisodes.map((ep) => (
 <div 
 key={ep.id}
 onClick={() => { navigate(`/watch/${ep.id}`); setShowDrawer(false); }}
 className={`flex gap-6 group cursor-pointer transition-all ${episodeId === ep.id ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}
 >
 <div className="relative w-32 h-20 flex-shrink-0 bg-neutral-900 overflow-hidden">
 <img loading="lazy" src={ep.thumbnail || anime?.image || undefined} className="w-full h-full object-cover transition-transform duration-700" alt="" />
 <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${episodeId === ep.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
 <BoxyPlay size={20} fill="white" />
 </div>
 </div>
 <div className="flex flex-col justify-center gap-1">
 <span className="text-[10px] font-medium text-white/90">Episode {ep.episodeNumber}</span>
 <h4 className={`text-micro md:text-body font-medium tracking-tight leading-snug ${episodeId === ep.id ? 'text-white' : 'text-white/90 group-hover:text-white'} transition-colors`}>{ep.title}</h4>
 </div>
 </div>
 )) : (
 <p className="text-white/90 text-micro font-medium">No more episodes available.</p>
 )}
 </div>

 <div className="mt-auto pt-10">
 <button 
 onClick={() => navigate(`/anime/${episode.animeId}`)}
 className="w-full py-4 bg-neutral-900 text-white/90 font-medium text-micro hover:bg-white hover:text-black transition-all tracking-tight"
 >
 View full series
 </button>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>

 {/* 4. SUBTLE OVERLAY GRADIENTS (FOR IMMERSION) */}
 <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.5)] z-20" />
 </>
 );
 })()}
 </div>
 );
};

export default Watch;
