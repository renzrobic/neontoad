import React, { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { BoxyReels } from '../components/ui/BoxyIcons';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, getDocs, orderBy, limit, startAfter, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SkeletonReel from '../components/skeletons/SkeletonReel';
import ReelCard from '../components/reels/ReelCard';
const ReelUpload = lazy(() => import('../components/reels/ReelUpload'));

const Reel = () => {
 const containerRef = useRef(null);
 const navigate = useNavigate();
 const { reelId: urlReelId } = useParams();
 const [reels, setReels] = useState([]);
 const [activeIndex, setActiveIndex] = useState(0);
 const [loading, setLoading] = useState(true);
 const [showUpload, setShowUpload] = useState(false);
 const [lastDoc, setLastDoc] = useState(null);
 const [hasMore, setHasMore] = useState(true);
 const [loadingMore, setLoadingMore] = useState(false);
 const [isMuted, setIsMuted] = useState(false);
 const [volume, setVolume] = useState(1);
 const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

 useEffect(() => {
 const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
 window.addEventListener('resize', handleResize);
 return () => window.removeEventListener('resize', handleResize);
 }, []);

 const fetchReels = async (isInitial = true) => {
 if (!hasMore && !isInitial) return;
 if (loadingMore) return;
 if (isInitial) setLoading(true); else setLoadingMore(true);
 try {
 let fetched = [];
 if (isInitial && urlReelId) {
 const snap = await getDoc(doc(db, 'reels', urlReelId));
 if (snap.exists()) fetched.push({ id: snap.id, ...snap.data() });
 }
 let q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'), limit(5));
 if (!isInitial && lastDoc) q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(5));
 const qs = await getDocs(q);
 const newBatch = qs.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.id !== urlReelId);
 fetched = [...fetched, ...newBatch];
 if (newBatch.length < 5) setHasMore(false);
 setLastDoc(qs.docs[qs.docs.length - 1]);
 setReels(prev => isInitial ? fetched : [...prev, ...newBatch]);
 } catch (err) { console.error('Error fetching reels:', err); }
 finally { if (isInitial) setLoading(false); else setLoadingMore(false); }
 };

 useEffect(() => { fetchReels(true); window.scrollTo(0, 0); }, [urlReelId]);

 useEffect(() => {
 if (loading || reels.length === 0) return;
 const handleIntersect = entries => {
 entries.forEach(entry => {
 if (entry.isIntersecting) {
 const idx = parseInt(entry.target.getAttribute('data-index'));
 setActiveIndex(idx);
 if (reels[idx]) window.history.replaceState(null, '', `/reel/${reels[idx].id}`);
 if (idx >= reels.length - 3 && hasMore && !loadingMore) fetchReels(false);
 }
 });
 };
 const observer = new IntersectionObserver(handleIntersect, { threshold: 0.5 });
 containerRef.current?.querySelectorAll('.reel-container').forEach(el => observer.observe(el));
 return () => observer.disconnect();
 }, [loading, loadingMore, reels, hasMore]);

 return (
 <div className="fixed inset-0 bg-transparent z-0">
 {reels[activeIndex] && (
 <Helmet>
 <title>{reels[activeIndex].videoTitle || reels[activeIndex].animeTitle} | NeonToad</title>
 <meta name="description" content={reels[activeIndex].caption} />
 <meta property="og:title" content={reels[activeIndex].videoTitle || reels[activeIndex].animeTitle} />
 <meta property="og:image" content={reels[activeIndex].url?.replace('/video/upload/', '/video/upload/so_1,f_jpg/') || reels[activeIndex].userAvatar} />
 </Helmet>
 )}

 <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar [overscroll-behavior-y:contain]">
 {loading
 ? [...Array(2)].map((_, i) => (
 <div key={i} className="h-[100dvh] w-full snap-start"><SkeletonReel /></div>
 ))
 : reels.length > 0
 ? reels.map((reel, index) => {
 const isAdjacent = Math.abs(activeIndex - index) <= 2;
 return (
 <div key={reel.id} data-index={index} className="reel-container h-[100dvh] w-full snap-start [scroll-snap-stop:always]">
 <ReelCard
 video={reel} isActive={activeIndex === index} isAdjacent={isAdjacent}
 onUploadClick={() => setShowUpload(true)}
 isMuted={isMuted} setIsMuted={setIsMuted}
 volume={volume} setVolume={setVolume}
 isDesktop={isDesktop}
 />
 </div>
 );
 })
 : (
 <div className="h-[100dvh] w-full flex flex-col items-center justify-center text-white gap-6 px-6 text-center">
 <div className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center">
 <BoxyReels size={40} className="opacity-20 text-white" />
 </div>
 <div className="space-y-2">
 <p className="font-semibold text-micro text-white">No reels yet</p>
 <p className="font-medium text-micro opacity-60">Be the first to start the trend!</p>
 </div>
 <button onClick={() => setShowUpload(true)}
 className="bg-primary text-background px-10 py-4 font-medium text-micro hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 tracking-wide rounded-full">
 Upload your first reel
 </button>
 </div>
 )
 }
 </div>

 <AnimatePresence>
 {showUpload && (
 <Suspense fallback={null}>
 <ReelUpload onClose={() => setShowUpload(false)} onComplete={() => window.location.reload()} />
 </Suspense>
 )}
 </AnimatePresence>
 </div>
 );
};

export default Reel;
