import React, { useState, useEffect, lazy, Suspense } from 'react';
const ReactPlayer = lazy(() => import('react-player'));
import { BoxyPlay, BoxyInfo } from '../ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonHero from '../skeletons/SkeletonHero';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

const HeroBanner = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [featuredList, setFeaturedList] = useState([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [isNavigating, setIsNavigating] = useState(null);

 useEffect(() => {
 const fetchFeatured = async () => {
 try {
 // Fetch custom featured items from the Admin 'featured' collection
 const q = query(collection(db, 'featured'), orderBy('createdAt', 'desc'), limit(5));
 const snapshot = await getDocs(q);
 
 let customFeatured = [];
 for (const d of snapshot.docs) {
 const featuredData = d.data();
 // Fetch the actual anime document for this featured item
 const aDoc = await getDoc(doc(db, 'anime', String(featuredData.animeId)));
 if (aDoc.exists()) {
 let latestEpisodeId = null;
 const epsQuery = query(collection(db, 'episodes'), where('animeId', '==', aDoc.id));
 const epsSnap = await getDocs(epsQuery);
 if (!epsSnap.empty) {
 const eps = epsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(e => e.status !== 'queued');
 eps.sort((a,b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
 if (eps.length > 0) latestEpisodeId = eps[0].id;
 }

 customFeatured.push({
 ...aDoc.data(),
 id: aDoc.id,
 latestEpisodeId,
 // Admin overrides
 image: featuredData.customImage || aDoc.data().image,
 customTagline: featuredData.tagline,
 customTitleLogo: featuredData.customTitleLogo || aDoc.data().titleLogo
 });
 }
 }

 // If no custom featured items exist, fallback to the newest episode logic
 if (customFeatured.length === 0) {
 let fallbackAnime = null;
 const fallbackQuery = query(collection(db, 'episodes'), orderBy('createdAt', 'desc'), limit(50));
 const epSnap = await getDocs(fallbackQuery);
 
 let episodes = [];
 if (!epSnap.empty) {
 episodes = epSnap.docs.map(d => ({ id: d.id, ...d.data() }));
 }

 const queuedQuery = query(collection(db, 'episodes'), where('status', '==', 'queued'));
 const queuedSnap = await getDocs(queuedQuery);
 const queuedEps = queuedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

 const allEpsMap = new Map();
 episodes.forEach(ep => allEpsMap.set(ep.id, ep));
 queuedEps.forEach(ep => allEpsMap.set(ep.id, ep));
 episodes = Array.from(allEpsMap.values());
 
 const now = new Date();
 episodes = episodes.filter(ep => {
 if (ep.status !== 'queued') return true;
 if (!ep.releaseDate) return false;
 return ep.releaseDate.toDate() <= now;
 });

 if (episodes.length > 0) {
 episodes.sort((a, b) => {
 const dateA = a.releaseDate ? a.releaseDate.toDate() : (a.createdAt ? a.createdAt.toDate() : new Date(0));
 const dateB = b.releaseDate ? b.releaseDate.toDate() : (b.createdAt ? b.createdAt.toDate() : new Date(0));
 return dateB - dateA;
 });
 const newestEp = episodes[0];
 let aDoc = await getDoc(doc(db, 'anime', String(newestEp.animeId)));

 if (aDoc.exists()) {
 fallbackAnime = { 
 id: aDoc.id, 
 ...aDoc.data(), 
 latestEpisodeId: newestEp.id, 
 customTagline: `Episode ${newestEp.episodeNumber || ''} Just Released!`,
 customImage: aDoc.data().bannerImage,
 customVideo: aDoc.data().bannerVideo,
 customTitleLogo: aDoc.data().titleLogo
 };
 }
 }
 if (fallbackAnime) customFeatured.push(fallbackAnime);
 }

 setFeaturedList(customFeatured);
 setLoading(false);
 } catch (err) {
 console.error("Error fetching featured anime:", err);
 setLoading(false);
 }
 };

 fetchFeatured();
 }, []);

 useEffect(() => {
 if (featuredList.length <= 1) return;
 const timer = setInterval(() => {
 setCurrentIndex(prev => (prev + 1) % featuredList.length);
 }, 7000); // Rotate every 7 seconds
 return () => clearInterval(timer);
 }, [featuredList]);

 const featuredAnime = featuredList[currentIndex] || null;

 return (
 <div className="relative min-h-[85vh] md:min-h-[95vh] h-auto w-full overflow-hidden bg-transparent flex flex-col justify-end">
 <AnimatePresence>
 {loading && (
 <motion.div
 key="skeleton"
 initial={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.5 }}
 className="absolute inset-0 z-50"
 >
 <SkeletonHero />
 </motion.div>
 )}
 </AnimatePresence>

 {/* Video/Image Background */}
 <div 
 className="absolute top-0 left-0 w-full h-full pointer-events-none"
 style={{
 WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
 maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
 }}
 >
 {!loading && featuredAnime && (
 featuredAnime.customVideo ? (
 <Suspense fallback={null}>
 <ReactPlayer
 url={featuredAnime.customVideo}
 playing={true}
 loop={true}
 muted={true}
 width="100%"
 height="140%"
 style={{ position: 'absolute', top: '-20%', left: 0, opacity: 0.8 }}
 config={{
 youtube: {
 playerVars: { showinfo: 0, controls: 0, autohide: 1, modestbranding: 1 }
 }
 }}
 />
 </Suspense>
 ) : (
 <img loading="lazy"
 src={featuredAnime.customImage || featuredAnime.image || undefined}
 className="w-full h-full object-cover opacity-60"
 alt="Background"
 />
 )
 )}

 <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent opacity-100" />
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
 </div>

 {/* Content Container - Aligned with AnimeRow */}
 <div className="relative h-full px-4 md:px-16 w-full flex flex-col justify-end pt-24 md:pt-40 pb-12 md:pb-32 gap-3 md:gap-4 z-10">
 {!loading && featuredAnime && (
 <motion.div
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8, delay: 0.2 }}
  className="z-10"
  >
  {featuredAnime.customTitleLogo ? (
  <img 
  src={featuredAnime.customTitleLogo} 
  alt={featuredAnime.title} 
  className="max-h-[120px] md:max-h-[160px] lg:max-h-[200px] w-auto object-contain mb-4 md:mb-6 drop-shadow-2xl" 
  />
  ) : (
  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-2 md:mb-4 max-w-3xl drop-shadow-lg">
  {featuredAnime.title}
  </h1>
  )}

  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-5 text-xs md:text-sm text-white/80 font-medium">
  {featuredAnime.customTagline && (
  <span className="text-primary font-bold uppercase tracking-wider">
  {featuredAnime.customTagline}
  </span>
  )}
  {featuredAnime.customTagline && <span className="text-white/40">|</span>}
  <span>{featuredAnime.rating ? `${featuredAnime.rating} Score` : '8.9 Score'}</span>
  <span className="text-white/40">|</span>
  <span>{featuredAnime.type || 'Series'}</span>
  <span className="text-white/40">|</span>
  <span>{featuredAnime.genres?.join(', ') || 'Action'}</span>
  </div>

  <p className="text-white/70 text-sm md:text-base font-normal mb-6 md:mb-8 max-w-2xl leading-relaxed drop-shadow-md line-clamp-2 md:line-clamp-3">
  {featuredAnime.description}
  </p>

  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
  <button
  disabled={isNavigating !== null}
  onClick={() => {
  setIsNavigating('watch');
  setTimeout(() => {
  navigate(featuredAnime.latestEpisodeId ? `/watch/${featuredAnime.latestEpisodeId}` : `/watch/${featuredAnime.id}`);
  }, 0);
  }}
  className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-primary text-background px-8 h-10 md:h-11 rounded-sm hover:bg-primary/90 transition-all active:scale-95 shadow-lg disabled:opacity-70 disabled:cursor-wait font-bold tracking-wide text-sm"
  >
  {isNavigating === 'watch' ? (
  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
  ) : (
  <><BoxyPlay className="fill-background w-4 h-4 md:w-5 md:h-5" size={20} /><span>WATCH NOW</span></>
  )}
  </button>
  <button
  disabled={isNavigating !== null}
  onClick={() => {
  setIsNavigating('info');
  setTimeout(() => {
  navigate(`/anime/${featuredAnime.id}`);
  }, 0);
  }}
  className="w-full sm:w-auto justify-center bg-transparent border-2 border-white/30 text-white px-6 h-10 md:h-11 rounded-sm font-semibold flex items-center gap-2 hover:bg-white/10 hover:border-white/50 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-wait text-sm"
  >
  {isNavigating === 'info' ? (
  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
  ) : (
  <><BoxyInfo className="w-4 h-4 md:w-5 md:h-5" size={20} /><span>More info</span></>
  )}
  </button>
  </div>
  </motion.div>
 )}
 </div>
 </div>
 );
};

export default HeroBanner;
