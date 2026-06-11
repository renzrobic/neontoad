import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SkeletonWatch from '../components/skeletons/SkeletonWatch';
import VideoEmbed from '../components/VideoEmbed';
import { BoxyPlay, BoxyInfo, BoxyMessage, BoxyChevron, BoxyList, BoxyShare, BoxyAlert, BoxyMaximize, BoxyMinimize, BoxyX, BoxyTV } from '../components/ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useWatchData } from '../hooks/useWatchData.jsx';

const EpisodesWheel = ({ episodes, initialIndex, onClose, onSelect, anime }) => {
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, initialIndex));
  
  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      setSelectedIndex(prev => Math.min(episodes.length - 1, prev + 1));
    } else if (e.deltaY < 0) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(episodes.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(episodes[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, episodes, onSelect, onClose]);

  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientY);
  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const touchEnd = e.targetTouches[0].clientY;
    if (touchStart - touchEnd > 50) {
      setSelectedIndex(prev => Math.min(episodes.length - 1, prev + 1));
      setTouchStart(touchEnd);
    } else if (touchStart - touchEnd < -50) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      setTouchStart(touchEnd);
    }
  };

  return (
    <>
      {/* Background click catcher - extremely subtle dimming */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/10 z-[105]"
      />

      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 w-full md:w-[500px] h-full flex items-center justify-center z-[110]"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Close Button Only */}
        <div className="absolute top-8 right-8 z-[120]">
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10">
             <BoxyX size={24} />
           </button>
        </div>

        {/* 3D Wheel Container with Fade Mask */}
        <div className="relative w-full h-[85vh] flex items-center justify-center" 
             style={{ 
               perspective: '1200px',
               maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
               WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' 
             }}>
          <AnimatePresence mode="popLayout">
            {episodes.map((ep, i) => {
              const distance = i - selectedIndex;
              if (Math.abs(distance) > 6) return null;

              const yOffset = distance * 115; 
              // Curve logic: Front card sticks out left, back cards sweep to the right
              const xOffset = distance === 0 ? -40 : Math.abs(distance) * 25 - 10;
              const scale = 1 - Math.abs(distance) * 0.15;
              const zIndex = 50 - Math.abs(distance);
              const opacity = distance === 0 ? 1 : 1 - Math.abs(distance) * 0.15;
              const rotateX = distance * -8; 

              return (
                <motion.div
                  key={ep.id}
                  layout
                  initial={false}
                  animate={{
                    y: yOffset,
                    x: xOffset,
                    scale: scale,
                    zIndex: zIndex,
                    opacity: opacity,
                    rotateX: rotateX,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (distance === 0) {
                      onSelect(ep);
                    } else {
                      setSelectedIndex(i);
                    }
                  }}
                  className={`absolute w-[85%] md:w-[340px] aspect-video rounded-none overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)] border-[2px] ${distance === 0 ? 'border-white/80 cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.15)]' : 'border-white/10 cursor-pointer'}`}
                >
                  <img src={ep.thumbnail || anime?.image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-5 md:p-6">
                    <div className="flex justify-between items-end gap-3">
                      <div className="min-w-0">
                        <h3 className="text-white text-xl md:text-2xl font-bold tracking-tight mb-1 truncate drop-shadow-md">Ep {ep.episodeNumber}</h3>
                        <p className="text-white/80 text-xs md:text-sm line-clamp-1 drop-shadow-md">{ep.title}</p>
                      </div>
                      {distance === 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black mb-1 flex-shrink-0 shadow-xl">
                          <BoxyPlay size={24} fill="currentColor" className="ml-1" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        <div className="absolute bottom-8 text-white/50 text-xs font-medium pointer-events-none z-[120] text-center w-full px-4 drop-shadow-md">
          Scroll or swipe to browse • Click to play
        </div>
      </motion.div>
    </>
  );
};

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTime = parseFloat(searchParams.get('t')) || 0;
  
  const { episode, anime, otherEpisodes, loading, skipTimes, progressRef } = useWatchData(episodeId);
  
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFauxFullscreen, setIsFauxFullscreen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { updateWatchProgress, activeProfile, user } = useAuth();
  const [streamBlocked, setStreamBlocked] = useState(false);

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
          if (data.deviceId !== deviceId && timeSinceLastPing < 20000) {
            if (isComponentMounted) setStreamBlocked(true);
            return;
          }
        }
        await setDoc(streamRef, { deviceId, lastPing: serverTimestamp() });
        intervalId = setInterval(async () => {
          try { await setDoc(streamRef, { deviceId, lastPing: serverTimestamp() }); } catch (e) {}
        }, 10000);
      } catch (err) {}
    };

    checkAndClaimStream();
    return () => {
      isComponentMounted = false;
      if (intervalId) clearInterval(intervalId);
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
          if (elem.requestFullscreen) await elem.requestFullscreen();
          else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
          else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
          
          if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
            try { await window.screen.orientation.lock('landscape'); } catch (e) {}
          }
          setIsFauxFullscreen(true);
        } else {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
          else if (document.msExitFullscreen) await document.msExitFullscreen();
          
          if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
            window.screen.orientation.unlock();
          }
          setIsFauxFullscreen(false);
        }
      } else {
        const videoElem = document.querySelector('video');
        if (videoElem && videoElem.webkitEnterFullscreen) videoElem.webkitEnterFullscreen();
        else setIsFauxFullscreen(!isFauxFullscreen);
      }
    } catch (err) {
      const videoElem = document.querySelector('video');
      if (videoElem && videoElem.webkitEnterFullscreen) videoElem.webkitEnterFullscreen();
      else setIsFauxFullscreen(!isFauxFullscreen);
    }
  };

  useEffect(() => {
    return () => {
      if (progressRef.current.time > 5 && episode && anime) {
        updateWatchProgress(anime, episode, progressRef.current.time, progressRef.current.duration);
      }
    };
  }, [episode, anime, updateWatchProgress]);

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

 if (loading) return <SkeletonWatch />;

 if (!episode) {
 return (
 <div className="pt-24 md:pt-32 min-h-screen bg-transparent">
 <Helmet><title>Episode Not Found | NeonToad</title></Helmet>
 <EmptyState message="Episode not found in database" />
 </div>
 );
 }



 return (
 <div className={`h-screen w-full bg-transparent overflow-hidden relative flex flex-col ${isFauxFullscreen ? 'faux-fullscreen-mobile' : ''}`}>
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
                onProgress={(time, dur) => {
                  progressRef.current = { time, duration: dur };
                }}
                initialTime={initialTime}
                skipTimes={skipTimes}
                anime={anime}
                episode={episode}
                onBack={() => navigate(-1)}
                onEpisodesClick={() => setShowDrawer(!showDrawer)}
                onToggleFullscreen={toggleFullscreen}
                topControls={
                  <div className="p-4 md:p-8 flex items-center justify-between w-full pointer-events-none">
                    <button 
                      onClick={() => navigate(-1)}
                      className="w-10 h-10 flex items-center justify-center hover:scale-110 transition-all pointer-events-auto group drop-shadow-lg"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white/80 transition-colors">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                    </button>

                    <div className="flex items-center pointer-events-auto">
                      <span className="text-white font-medium text-sm md:text-lg drop-shadow-lg tracking-wide">
                        S{anime?.season || 1}:E{episode.episodeNumber} {episode.title}
                      </span>
                    </div>
                  </div>
                }
              />
 </div>

 {/* 3. NEXT EPISODE WHEEL */}
 <AnimatePresence>
 {showDrawer && (
  <EpisodesWheel 
    episodes={otherEpisodes} 
    anime={anime}
    initialIndex={currentEpIndex} 
    onClose={() => setShowDrawer(false)}
    onSelect={(ep) => {
      setShowDrawer(false);
      navigate(`/watch/${ep.id}`);
    }}
  />
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
