import React, { useState, useRef, useEffect } from 'react';
import { BoxyPlay, BoxyPause, BoxyVolume, BoxyVolumeX, BoxyMaximize, BoxyMinimize, BoxyRotateCcw, BoxyRotateCw, BoxySkipForward, BoxySubtitles, BoxyEpisodes } from '../ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const CustomVideoPlayer = React.forwardRef(({ src, onTimeUpdate, onEnded, onLoadedData, onError, initialTime = 0, onPlay, skipTimes, skipAnim, topControls, children, anime, episode, onBack, onEpisodesClick, onToggleFullscreen }, ref) => {
  const defaultVideoRef = useRef(null);
  const videoRef = ref || defaultVideoRef;
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Center Flash Animation State
  const flashTimeout = useRef(null);
  const [flashIcon, setFlashIcon] = useState(null);
  const [flashKey, setFlashKey] = useState(0);

  const triggerFlash = (type) => {
    setFlashIcon(type);
    setFlashKey(prev => prev + 1);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => {
      setFlashIcon(null);
    }, 500);
  };
  const hideControlsTimeout = useRef(null);

  const startHideTimer = () => {
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    setShowControls(true);
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  };

  useEffect(() => {
    startHideTimer();
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, [isPlaying]);

  const handleMouseMove = () => {
    startHideTimer();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  const handleContainerTap = (e) => {
    // If clicking on controls, don't toggle
    if (e.target === containerRef.current || e.target === videoRef.current || e.target.id === 'controls-overlay' || e.target.id === 'center-play-area') {
      if (showControls) {
        // Only toggle playback if we click the center area and controls are already showing
        handlePlayPause(e);
      } else {
        setShowControls(true);
        startHideTimer();
      }
    }
  };

  const handlePlayPause = (e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        triggerFlash('pause');
      } else {
        videoRef.current.play();
        triggerFlash('play');
      }
    }
  };

  const skipBy = (amount, e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + amount);
      triggerFlash(amount > 0 ? 'forward' : 'rewind');
    }
  };

  const handleVideoTimeUpdate = (e) => {
    const current = e.target.currentTime;
    const dur = e.target.duration;
    setCurrentTime(current);
    setDuration(dur);
    setProgress((current / dur) * 100);
    if (onTimeUpdate) onTimeUpdate(e);
  };

  const lastTapRef = useRef({ time: 0, x: 0 });

  const handleDoubleClick = (e) => {
    if (!videoRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isRightSide = e.clientX > rect.left + rect.width / 2;
    if (isRightSide) {
      skipBy(10, e);
    } else {
      skipBy(-10, e);
    }
  };

  const handleCustomTouchStart = (e) => {
    handleMouseMove(); // Wake up controls
    if (e.touches.length === 1) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapRef.current.time;
      const touchX = e.touches[0].clientX;
      
      // Instant double-tap detection for mobile (bypass 300ms native delay)
      if (tapLength < 300 && tapLength > 0) {
        if (!containerRef.current || !videoRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const isRightSide = touchX > rect.left + rect.width / 2;
        if (isRightSide) {
          skipBy(10, e);
        } else {
          skipBy(-10, e);
        }
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: currentTime, x: touchX };
      }
    }
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else setVolume(videoRef.current.volume || 1);
    }
  };

  const toggleFullscreen = async (e) => {
    if (e) e.stopPropagation();
    
    // Delegate fullscreen to parent if provided (fixes iOS Fullscreen bugs)
    if (onToggleFullscreen) {
      onToggleFullscreen(e);
      return;
    }

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        await containerRef.current.webkitRequestFullscreen();
      }
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
      if (window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing in an input
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          skipBy(-10);
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          skipBy(10);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-transparent flex justify-center items-center group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleCustomTouchStart}
      onClick={handleContainerTap}
      onDoubleClick={handleDoubleClick}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        webkit-playsinline="true"
        onLoadedData={(e) => {
          setDuration(e.target.duration);
          if (initialTime > 0) e.target.currentTime = initialTime;
          if (onLoadedData) onLoadedData(e);
          e.target.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }}
        onError={onError}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={onEnded}
        onPlay={(e) => {
          setIsPlaying(true);
          if (onPlay) onPlay(e);
        }}
        onPause={() => setIsPlaying(false)}
      />

      {/* Flash Animations (Play/Pause Center, Skip Sides) */}
      <AnimatePresence>
        {(flashIcon === 'play' || flashIcon === 'pause') && (
          <motion.div
            key={`center-${flashKey}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-2xl">
              {flashIcon === 'play' && <BoxyPlay size={64} fill="currentColor" className="ml-3" />}
              {flashIcon === 'pause' && <BoxyPause size={64} fill="currentColor" />}
            </div>
          </motion.div>
        )}

        {flashIcon === 'forward' && (
          <motion.div
            key={`fwd-${flashKey}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute right-12 md:right-24 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white font-medium text-2xl md:text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] z-[60] pointer-events-none"
          >
            +10 <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </motion.div>
        )}

        {flashIcon === 'rewind' && (
          <motion.div
            key={`rew-${flashKey}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute left-12 md:left-24 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white font-medium text-2xl md:text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] z-[60] pointer-events-none"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> -10
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <div 
        id="controls-overlay"
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 flex flex-col justify-between z-[50] ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Top Controls Area */}
        <div className="w-full pt-6 pb-12 px-4 md:px-8 flex items-start justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" onClick={(e) => e.stopPropagation()}>
          <div className="flex-1 pointer-events-auto">
            {topControls}
          </div>
        </div>



        {/* External Overlays (Up Next) synced with UI visibility */}
        <div className="absolute inset-0 pointer-events-none">
          {children}
        </div>

        {/* Bottom Controls Area (Netflix Desktop Style) */}
        <div className="px-4 pb-6 md:px-8 md:pb-8 flex flex-col w-full bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-32" onClick={(e) => e.stopPropagation()}>
          
          <div className="flex flex-col w-full gap-2 relative z-50 pointer-events-auto">
            {/* White Progress Bar */}
            <div 
              ref={progressRef}
              className="w-full h-1 bg-white/30 cursor-pointer relative group/progress rounded-full overflow-visible"
            >
              <div 
                className="absolute top-0 left-0 h-full bg-white z-10 pointer-events-none rounded-full" 
                style={{ width: `${progress}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full z-20 shadow-lg scale-0 group-hover/progress:scale-100 transition-transform origin-center pointer-events-none"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
              <input
                type="range" min="0" max={duration || 100} step="0.01" value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                    setProgress((newTime / videoRef.current.duration) * 100);
                  }
                }}
                className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-30"
              />
            </div>
            
            {/* Bottom Row: Play & Volume (Left) | Controls (Right) */}
            <div className="flex items-center justify-between mt-3 px-1">
              {/* Play, Skip & Volume */}
              <div className="flex items-center gap-4 md:gap-6">
                <button onClick={handlePlayPause} className="text-white hover:text-white/80 transition-colors drop-shadow-lg flex-shrink-0 rounded-xl" title={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <BoxyPause size={28} fill="currentColor" /> : <BoxyPlay size={28} fill="currentColor" />}
                </button>
                
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <button onClick={(e) => skipBy(-10, e)} className="text-white hover:text-white/80 transition-transform active:scale-90 drop-shadow-lg relative flex items-center justify-center" title="Rewind 10s">
                    <BoxyRotateCcw size={28} />
                    <span className="text-[8px] font-bold absolute mt-0.5">10</span>
                  </button>
                  <button onClick={(e) => skipBy(10, e)} className="text-white hover:text-white/80 transition-transform active:scale-90 drop-shadow-lg relative flex items-center justify-center" title="Forward 10s">
                    <BoxyRotateCw size={28} />
                    <span className="text-[8px] font-bold absolute mt-0.5">10</span>
                  </button>
                </div>

                <div className="hidden md:flex items-center group/volume relative ml-2">
                  <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors drop-shadow-lg rounded-xl">
                    {isMuted || volume === 0 ? <BoxyVolumeX size={24} /> : <BoxyVolume size={24} fill="currentColor" />}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center ml-2 relative h-6">
                    {/* Visual Track */}
                    <div className="w-20 h-1 bg-white/30 rounded-full relative overflow-hidden flex-shrink-0">
                       <div 
                         className="absolute top-0 left-0 h-full bg-white pointer-events-none" 
                         style={{ width: `${volume * 100}%` }}
                       />
                    </div>
                    {/* Invisible Range Input */}
                    <input
                      type="range" min="0" max="1" step="0.01" value={volume}
                      onChange={(e) => {
                        const pos = parseFloat(e.target.value);
                        setVolume(pos);
                        if (videoRef.current) {
                          videoRef.current.volume = pos;
                          videoRef.current.muted = pos === 0;
                          setIsMuted(pos === 0);
                        }
                      }}
                      className="absolute left-0 top-0 w-20 h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>

                <div className="text-white text-[11px] md:text-[13px] font-medium tracking-wide ml-2 md:ml-4 flex items-center gap-1 drop-shadow-md flex-shrink-0">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-white/50">/</span>
                  <span className="text-white/50">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Next Episode, Episodes, Fullscreen */}
              <div className="flex items-center gap-4 md:gap-7 flex-shrink-0">
                 <button className="text-white hover:text-white/80 transition-colors flex items-center gap-2 drop-shadow-lg rounded-xl" title="Next Episode">
                    <BoxySkipForward size={26} fill="currentColor" /> 
                 </button>
                 {onEpisodesClick && !isFullscreen && (
                   <button onClick={onEpisodesClick} className="text-white hover:text-white/80 transition-colors drop-shadow-lg rounded-xl" title="Episodes">
                      <BoxyEpisodes size={26} />
                   </button>
                 )}
                 <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors drop-shadow-lg rounded-xl">
                    {isFullscreen ? <BoxyMinimize size={26} /> : <BoxyMaximize size={26} />}
                 </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomVideoPlayer;
