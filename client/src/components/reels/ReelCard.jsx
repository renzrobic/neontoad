import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BoxyHeart, BoxyMessage, BoxyShare, BoxyPlay, BoxyPause, BoxyChevron, BoxyVolume, BoxyVolumeX, BoxyMoreVertical, BoxyShield, BoxyTV } from '../ui/BoxyIcons';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import CommentsDrawer from './CommentsDrawer';
import toast from 'react-hot-toast';

const ReelCard = React.memo(({ video, isActive, isAdjacent, onUploadClick, isMuted, setIsMuted, volume, setVolume, isDesktop }) => {
  const { activeProfile, user, toggleFollow, isBanned } = useAuth();
  const isFollowing = activeProfile?.following?.includes(video.userId);
  const displayAvatar = (video.userId === user?.uid && activeProfile?.avatarUrl) ? activeProfile.avatarUrl : video.userAvatar;
  const displayName = (video.userId === user?.uid && activeProfile?.name) ? activeProfile.name : (video.userName || 'User');

  const desktopVideoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const hideControlsTimer = useRef(null);
  const navigate = useNavigate();

  const [liked, setLiked] = useState(video.likedBy?.includes(auth.currentUser?.uid));
  const [likesCount, setLikesCount] = useState(video.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [commentsCount, setCommentsCount] = useState(video.comments || 0);

  useEffect(() => {
    setCommentsCount(video.comments || 0);
  }, [video.comments]);

  useEffect(() => {
    if (isActive && !viewCounted) {
      updateDoc(doc(db, 'reels', video.id), { views: increment(1) })
        .then(() => setViewCounted(true))
        .catch(err => console.error('Error incrementing views:', err));
    }
  }, [isActive, viewCounted, video.id]);

  useEffect(() => {
    if (desktopVideoRef.current) desktopVideoRef.current.volume = volume;
    if (mobileVideoRef.current) mobileVideoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const play = async () => {
      if (isActive && !isPaused) {
        try {
          if (desktopVideoRef.current) {
            desktopVideoRef.current.muted = isDesktop ? isMuted : true;
            await desktopVideoRef.current.play();
          }
          if (mobileVideoRef.current) {
            mobileVideoRef.current.muted = !isDesktop ? isMuted : true;
            await mobileVideoRef.current.play();
          }
          if (bgVideoRef.current) { bgVideoRef.current.muted = true; await bgVideoRef.current.play(); }
        } catch (_) {}
      } else {
        [desktopVideoRef, mobileVideoRef, bgVideoRef].forEach(ref => {
          if (ref.current) {
            ref.current.pause();
            if (!isActive) ref.current.currentTime = 0;
          }
        });
      }
    };
    play();
  }, [isActive, isPaused, isMuted, isDesktop]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); }, []);

  const handleVideoTap = useCallback(() => {
    if (showControls) {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      setShowControls(false);
    } else {
      showControlsTemporarily();
    }
  }, [showControls, showControlsTemporarily]);

  const handleMobileVideoTap = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width * 0.33) {
      seekBy(-5, e);
    } else if (x > width * 0.66) {
      seekBy(5, e);
    } else {
      setIsPaused(p => !p);
      showControlsTemporarily();
    }
  }, [seekBy, showControlsTemporarily]);

  const togglePlay = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  const handlePlayPause = useCallback(e => {
    e.stopPropagation();
    setIsPaused(p => !p);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const seekBy = useCallback((seconds, e) => {
    e.stopPropagation();
    const ref = isDesktop ? desktopVideoRef : mobileVideoRef;
    if (ref.current) {
      ref.current.currentTime = Math.max(0, Math.min(ref.current.duration || 0, ref.current.currentTime + seconds));
    }
    showControlsTemporarily();
  }, [isDesktop, showControlsTemporarily]);

  const handleTimeUpdate = useCallback(() => {
    if (isDragging) return;
    const ref = isDesktop ? desktopVideoRef : mobileVideoRef;
    if (ref.current) {
      setCurrentTime(ref.current.currentTime);
      setDuration(ref.current.duration || 0);
    }
  }, [isDesktop, isDragging]);

  const handleSliderChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    const ref = isDesktop ? desktopVideoRef : mobileVideoRef;
    if (ref.current) {
      ref.current.currentTime = newTime;
    }
  };

  const handleSeek = useCallback((e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ref = isDesktop ? desktopVideoRef : mobileVideoRef;
    if (ref.current && ref.current.duration) {
      ref.current.currentTime = ratio * ref.current.duration;
    }
    showControlsTemporarily();
  }, [isDesktop, showControlsTemporarily]);

  const formatTime = s => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const handleLike = async e => {
    if (e) e.stopPropagation();
    if (!auth.currentUser) { toast.error('Please login to like!'); return; }
    if (isBanned) { toast.error('You are banned from interacting.'); return; }
    const reelRef = doc(db, 'reels', video.id);
    const uid = auth.currentUser.uid;
    if (liked) {
      setLiked(false); setLikesCount(p => p - 1);
      await updateDoc(reelRef, { likedBy: arrayRemove(uid), likes: increment(-1) });
    } else {
      setLiked(true); setLikesCount(p => p + 1);
      await updateDoc(reelRef, { likedBy: arrayUnion(uid), likes: increment(1) });
      if (video.userId && uid !== video.userId) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: video.userId, actorId: uid,
          actorName: activeProfile?.name || auth.currentUser.displayName || 'User',
          actorAvatar: activeProfile?.avatarUrl || auth.currentUser.photoURL || '',
          type: 'like', targetId: video.id, targetPath: `/reel/${video.id}`,
          message: 'liked your reel', createdAt: serverTimestamp(), readBy: []
        });
      }
    }
  };

  const handleShare = async () => {
    try { await navigator.share({ title: video.animeTitle, text: video.caption, url: window.location.href }); }
    catch { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }
  };

  const handleReport = async () => {
    if (!auth.currentUser) { toast.error('Please login to report!'); return; }
    if (video.reportedBy?.includes(auth.currentUser.uid)) { toast.success('Already reported.'); return; }
    if (window.confirm('Report this reel for inappropriate content?')) {
      try {
        await updateDoc(doc(db, 'reels', video.id), { reportedBy: arrayUnion(auth.currentUser.uid), reportCount: increment(1) });
        toast.success('Reel reported. Admins will review it.');
      } catch { toast.error('Failed to report.'); }
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const renderActionColumn = (circular = false) => (
    <div className={`flex flex-col items-center ${circular ? 'gap-5' : 'gap-6'}`}>
      <button onClick={handleLike} className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}>
        <div className={`${circular ? 'w-12 h-12 rounded-full bg-white/5 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
          <BoxyHeart size={circular ? 22 : 26} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-white' : 'text-white/85 drop-shadow-md'} />
        </div>
        <span className="text-[12px] font-bold text-white drop-shadow-md">{likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}</span>
      </button>

      <button onClick={e => { e.stopPropagation(); setShowComments(true); }} className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}>
        <div className={`${circular ? 'w-12 h-12 rounded-full bg-white/5 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
          <BoxyMessage size={circular ? 22 : 26} className="text-white/85 drop-shadow-md" />
        </div>
        <span className="text-[12px] font-bold text-white drop-shadow-md">{commentsCount}</span>
      </button>

      <button onClick={e => { e.stopPropagation(); handleShare(); }} className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}>
        <div className={`${circular ? 'w-12 h-12 rounded-full bg-white/5 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
          <BoxyShare size={circular ? 22 : 26} className="text-white/85 drop-shadow-md" />
        </div>
        <span className="text-[12px] font-bold text-white drop-shadow-md">Share</span>
      </button>

      <div className="relative">
        <button onClick={e => { e.stopPropagation(); setShowMoreMenu(m => !m); }} className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}>
          <div className={`${circular ? 'w-12 h-12 rounded-full bg-white/5 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
            <BoxyMoreVertical size={circular ? 22 : 26} className="text-white/85 drop-shadow-md" />
          </div>
        </button>
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 8 }}
              className="absolute bottom-full right-full mb-2 mr-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl overflow-hidden min-w-[140px] z-50"
            >
              <button onClick={e => { e.stopPropagation(); handleReport(); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-white/90 hover:bg-white/10 backdrop-blur-md rounded-xl transition-colors text-left">
                <BoxyShield size={16} /> Report
              </button>
              {video.animeId && (
                <button onClick={e => { e.stopPropagation(); navigate(`/watch/${video.animeId}`); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-white/90 hover:bg-white/10 backdrop-blur-md rounded-xl transition-colors text-left">
                  <BoxyTV size={16} /> Watch Anime
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderTopCenterPill = (className ="") => {
    if (!video.animeTitle) return null;
    const isLong = video.animeTitle.length > 20;
    
    return (
      <div className={`bg-white/5 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-center shadow-xl overflow-hidden cursor-pointer group ${className}`} onClick={e => { e.stopPropagation(); if (video.animeId) navigate(`/anime/${video.animeId}`); }}>
        <BoxyTV size={14} className="text-white/90 flex-shrink-0 mr-2 group-hover:text-white transition-colors z-10" />
        {isLong ? (
          <div className="relative w-[160px] overflow-hidden flex-shrink-0" style={{ WebkitMaskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
            <div className="whitespace-nowrap text-[12px] font-bold text-white/90 group-hover:text-white transition-colors flex w-max" style={{ animation: `marquee ${Math.max(video.animeTitle.length * 0.2, 5)}s linear infinite` }}>
              <div className="flex items-center gap-4 pe-4"><span>{video.animeTitle}</span><span className="text-white/90">•</span></div>
              <div className="flex items-center gap-4 pe-4"><span>{video.animeTitle}</span><span className="text-white/90">•</span></div>
            </div>
          </div>
        ) : (
          <span className="whitespace-nowrap text-[12px] font-bold text-white/90 group-hover:text-white transition-colors">{video.animeTitle}</span>
        )}
      </div>
    );
  };

  const renderDesktopTopControls = () => {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none transition-all duration-300">
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, maxWidth: 0, marginRight: 0 }}
              animate={{ opacity: 1, maxWidth: 250, marginRight: 8 }}
              exit={{ opacity: 0, maxWidth: 0, marginRight: 0 }}
              transition={{ duration: 0.3, ease:"easeOut" }}
              className="flex items-center gap-2 pointer-events-auto overflow-hidden"
            >
              <button onClick={e => { e.stopPropagation(); togglePlay(); showControlsTemporarily(); }} className="w-9 h-9 flex-shrink-0 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 shadow-xl">
                {isPaused ? <BoxyPlay size={16} fill="currentColor" className="ml-0.5" /> : <BoxyPause size={16} fill="currentColor" />}
              </button>
              <div onClick={e => e.stopPropagation()} className="flex items-center gap-3 flex-shrink-0 bg-white/10 backdrop-blur-md h-9 rounded-full px-3 shadow-xl overflow-hidden w-12 hover:w-32 transition-all duration-300 ease-out group">
                <button onClick={() => { setIsMuted(m => !m); showControlsTemporarily(); }} className="text-white hover:text-white/90 transition-colors flex-shrink-0">
                  {isMuted || volume === 0 ? <BoxyVolumeX size={16} /> : <BoxyVolume size={16} />}
                </button>
                <div className="relative h-1 bg-neutral-700 rounded-full flex items-center w-0 opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300">
                  <div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                  <div className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none -ml-[6px]" style={{ left: `${(isMuted ? 0 : volume) * 100}%` }} />
                  <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={e => { const val = parseFloat(e.target.value); setVolume(val); setIsMuted(val === 0); showControlsTemporarily(); }} className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className={`pointer-events-auto flex-shrink-0 transition-opacity duration-300 ease-out ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {renderTopCenterPill("max-w-[400px]")}
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-[100dvh] w-full snap-start bg-transparent flex items-center justify-center overflow-hidden">
      {isDesktop && (
        <>
          <div className="absolute inset-0 z-0">
            {isAdjacent ? (
              <video ref={bgVideoRef} preload="auto" poster={video.url?.replace('/video/upload/', '/video/upload/so_1,f_jpg/')} src={video.url} className="w-full h-full object-cover blur-[80px] opacity-25" muted loop playsInline />
            ) : <div className="w-full h-full bg-transparent" />}
            <div className="absolute inset-0 bg-black/55" />
          </div>
          <div className="absolute left-10 top-10 flex items-center gap-3 z-[60]">
            <button onClick={() => navigate('/')} className="w-12 h-11 flex items-center justify-center bg-white/8 backdrop-blur-md hover:bg-white/15 text-white/90 hover:text-white transition-all rounded-full"><BoxyTV size={20} /></button>
            <button onClick={onUploadClick} className="w-12 h-11 flex items-center justify-center bg-white/8 backdrop-blur-md hover:bg-white/15 text-white/90 hover:text-white transition-all rounded-full"><BoxyTV size={20} /></button>
          </div>
          <motion.div animate={{ x: showComments ? -180 : 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="absolute inset-0 z-10 flex items-center justify-center gap-5 px-10">
            <div onClick={handleVideoTap} onMouseMove={showControlsTemporarily} className="relative h-[96vh] aspect-[9/16] bg-transparent shadow-2xl rounded-2xl border border-white/10 cursor-pointer overflow-hidden flex-shrink-0">
              {isAdjacent ? <video ref={desktopVideoRef} preload="auto" poster={video.url?.replace('/video/upload/', '/video/upload/so_1,f_jpg/')} src={video.url} className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none" loop muted={isMuted} playsInline disablePictureInPicture disableRemotePlayback onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} /> : <div className="absolute inset-0 flex items-center justify-center bg-transparent z-0"><BoxyPlay size={48} className="text-white/15" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none z-10" />
              {renderDesktopTopControls()}
              <div className={`absolute bottom-0 left-0 right-0 z-20 px-4 pt-4 pb-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <img loading="lazy" src={displayAvatar} className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0" alt="" />
                  <span className="text-white font-semibold text-[14px] tracking-tight">{displayName}</span>
                  {user && video.userId !== user?.uid && (
                    <><span className="text-white/90 font-bold mx-1">•</span><button onClick={e => { e.stopPropagation(); toggleFollow(video.userId); }} className={`text-[14px] font-bold transition-all ${isFollowing ? 'text-white/90' : 'text-white hover:text-white/90'}`}>{isFollowing ? 'Following' : 'Follow'}</button></>
                  )}
                </div>
                <p onClick={e => { e.stopPropagation(); setIsDescExpanded(p => !p); }} className={`text-[12px] text-white/90 font-medium leading-relaxed cursor-pointer tracking-tight ${isDescExpanded ? '' : 'line-clamp-2'}`}>{video.caption}</p>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 transition-all duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-2"><span className="text-[11px] font-bold text-white drop-shadow-md">{formatTime(currentTime)}</span><span className="text-[11px] font-bold text-white/90 drop-shadow-md">/ {formatTime(duration)}</span></div>
                <div className="relative w-full h-1 bg-neutral-700 rounded-full flex items-center"><div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} /><div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md pointer-events-none -ml-[7px]" style={{ left: `${progressPct}%` }} /><input type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSliderChange} onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)} onTouchStart={() => setIsDragging(true)} onTouchEnd={() => setIsDragging(false)} className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10" /></div>
              </div>
              <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <button onClick={(e) => { e.stopPropagation(); handlePlayPause(e); }} className="pointer-events-auto w-[68px] h-[68px] rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform shadow-2xl">{isPaused ? <BoxyPlay size={30} fill="currentColor" className="ml-1" /> : <BoxyPause size={30} fill="currentColor" />}</button>
              </div>
            </div>
            <div className={`flex flex-col items-center justify-end h-[96vh] pb-10 transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>{renderActionColumn(true)}</div>
          </motion.div>
          <AnimatePresence>
            {showComments && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowComments(false)} className="fixed inset-0 bg-white/5 z-[150] backdrop-blur-sm" /><CommentsDrawer reelId={video.id} reelAuthorId={video.userId} onClose={() => setShowComments(false)} onUpdateCount={setCommentsCount} /></>)}
          </AnimatePresence>
        </>
      )}

      {!isDesktop && (
        <div className="relative h-full w-full" onClick={handleMobileVideoTap}>
          {isAdjacent ? <video ref={mobileVideoRef} preload="auto" poster={video.url?.replace('/video/upload/', '/video/upload/so_1,f_jpg/')} src={video.url} className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none" loop muted={isMuted} playsInline disablePictureInPicture disableRemotePlayback onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} /> : <div className="absolute inset-0 bg-transparent z-0 flex items-center justify-center"><BoxyPlay size={48} className="text-white/90" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />
          <div className={`absolute top-0 left-0 right-0 z-40 h-[90px] px-4 pt-10 pb-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-center transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute left-4 pointer-events-auto"><button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-white drop-shadow-md"><BoxyChevron direction="left" size={28} /></button></div>
            <div className="pointer-events-auto w-full max-w-[200px] flex justify-center">{renderTopCenterPill("w-full")}</div>
            <div className="absolute right-4 pointer-events-auto"><button onClick={e => { e.stopPropagation(); onUploadClick(); }} className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-colors"><BoxyTV size={24} /></button></div>
          </div>
          <AnimatePresence>
            {showControls && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 z-30 flex items-center justify-center gap-8 pointer-events-none">
                <button onClick={handlePlayPause} className="pointer-events-auto w-[68px] h-[68px] rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform shadow-2xl">{isPaused ? <BoxyPlay size={30} fill="currentColor" className="ml-1" /> : <BoxyPause size={30} fill="currentColor" />}</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`absolute right-3 z-30 flex flex-col items-center gap-5 transition-all duration-300 ease-out bottom-[80px] ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-x-4'}`} onClick={e => e.stopPropagation()}>{renderActionColumn(false)}</div>
          <div className={`absolute left-0 right-[72px] z-30 px-4 transition-all duration-300 ease-out bottom-[55px] ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-4'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap"><img loading="lazy" src={displayAvatar} className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0" alt="" /><span className="text-white font-bold text-[14px] tracking-tight">{displayName}</span>{user && video.userId !== user?.uid && (<><span className="text-white/90 font-bold mx-0.5">•</span><button onClick={() => toggleFollow(video.userId)} className={`text-[14px] font-bold transition-all ${isFollowing ? 'text-white/90' : 'text-white hover:text-white/90'}`}>{isFollowing ? 'Following' : 'Follow'}</button></>)}</div>
            <p onClick={() => setIsDescExpanded(p => !p)} className={`text-[13px] text-white/90 font-medium leading-relaxed tracking-tight cursor-pointer ${isDescExpanded ? '' : 'line-clamp-2'}`}>{video.caption}</p>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 z-40 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} onClick={e => e.stopPropagation()}>
            <div className="px-4 mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={handlePlayPause} className="text-white drop-shadow-md active:scale-90 transition-transform rounded-xl">{isPaused ? <BoxyPlay size={20} fill="currentColor" /> : <BoxyPause size={20} fill="currentColor" />}</button>
                  <div className="flex items-center gap-2 group">
                    <button onClick={() => { setIsMuted(m => !m); showControlsTemporarily(); }} className="text-white drop-shadow-md">{isMuted || volume === 0 ? <BoxyVolumeX size={18} /> : <BoxyVolume size={18} />}</button>
                    <div className="relative w-16 h-1 bg-neutral-700 rounded-full flex items-center drop-shadow-md"><div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} /><div className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-md pointer-events-none -ml-[5px]" style={{ left: `${(isMuted ? 0 : volume) * 100}%` }} /><input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={e => { const val = parseFloat(e.target.value); setVolume(val); setIsMuted(val === 0); showControlsTemporarily(); }} className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10" /></div>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-white drop-shadow-md">{formatTime(currentTime)} <span className="text-white/90">/ {formatTime(duration)}</span></span>
              </div>
            </div>
            <div className="px-4 mb-4 transition-all duration-300"><div className="relative w-full h-1.5 bg-neutral-700 rounded-full flex items-center transition-all duration-300"><div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} /><div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md pointer-events-none -ml-[7px]" style={{ left: `${progressPct}%` }} /><input type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSliderChange} onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)} onTouchStart={() => setIsDragging(true)} onTouchEnd={() => setIsDragging(false)} className="absolute inset-0 w-full h-10 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10" /></div></div>
          </div>
          <AnimatePresence>
            {showComments && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowComments(false)} className="fixed inset-0 bg-white/10 z-[180] backdrop-blur-sm" /><CommentsDrawer reelId={video.id} reelAuthorId={video.userId} onClose={() => setShowComments(false)} onUpdateCount={setCommentsCount} /></>)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

export default ReelCard;
