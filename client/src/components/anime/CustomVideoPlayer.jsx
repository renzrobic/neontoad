import React, { useState, useRef, useEffect } from 'react';
import { BoxyPlay, BoxyPause, BoxyVolume, BoxyVolumeX, BoxyMaximize, BoxyMinimize } from '../ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const CustomVideoPlayer = React.forwardRef(({ src, onTimeUpdate, onEnded, onLoadedData, onError, initialTime = 0, onPlay, skipTimes, skipAnim, topControls, children }, ref) => {
  const defaultVideoRef = useRef(null);
  const videoRef = ref || defaultVideoRef;
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Auto-hide controls logic
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
    // If clicking directly on the container (not a button inside it)
    if (e.target === containerRef.current || e.target === videoRef.current || e.target.id === 'controls-overlay' || e.target.id === 'center-play-area') {
      if (showControls) {
        setShowControls(false);
        if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
      } else {
        setShowControls(true);
        startHideTimer();
      }
    }
  };

  // Video Events
  const handlePlayPause = (e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
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

  const handleDoubleClick = (e) => {
    if (!videoRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isRightSide = e.clientX > rect.left + rect.width / 2;
    if (isRightSide) {
      videoRef.current.currentTime += 10;
    } else {
      videoRef.current.currentTime -= 10;
    }
  };

  const handleProgressClick = (e) => {
    // Legacy onClick handled by input range now
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else setVolume(videoRef.current.volume || 1);
    }
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
      if (newVol === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = async (e) => {
    if (e) e.stopPropagation();
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        await containerRef.current.webkitRequestFullscreen();
      }
      // Attempt landscape lock
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
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black flex justify-center items-center group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseMove}
      onClick={handleContainerTap}
      onDoubleClick={handleDoubleClick}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        webkit-playsinline="true"
        onLoadedData={(e) => {
          setDuration(e.target.duration);
          if (initialTime > 0) e.target.currentTime = initialTime;
          if (onLoadedData) onLoadedData(e);
          // Auto-play attempt
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

      {/* Skip Animation Overlay (Forward/Backward 10s) */}
      {skipAnim && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-[60] pointer-events-none flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 ${skipAnim === 'forward' ? 'right-1/4' : 'left-1/4'}`}>
          <div className="bg-black/60 backdrop-blur-md text-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-2xl">
            <span className="text-h4 font-bold tracking-tighter">{skipAnim === 'forward' ? '+10s' : '-10s'}</span>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        id="controls-overlay"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex flex-col justify-between z-[50] ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Top Controls Area */}
        <div className="w-full bg-gradient-to-b from-black/80 to-transparent p-4" onClick={(e) => e.stopPropagation()}>
          {topControls}
        </div>

        {/* Center Play/Pause Button */}
        <div id="center-play-area" className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); handlePlayPause(e); }}
            className="pointer-events-auto w-20 h-20 md:w-24 md:h-24 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
          >
            {isPlaying ? <BoxyPause size={48} fill="currentColor" /> : <BoxyPlay size={48} fill="currentColor" className="ml-2" />}
          </button>
        </div>

        {/* External Overlays (Skip Intro, Up Next) synced with UI visibility */}
        <div className="absolute inset-0 pointer-events-none">
          {children}
        </div>

        {/* Bottom Controls Area */}
        <div className="px-4 pb-4 md:px-6 md:pb-6 flex flex-col gap-2 w-full bg-gradient-to-t from-black/80 to-transparent pt-12" onClick={(e) => e.stopPropagation()}>
          
          {/* Progress Bar (YouTube Style) */}
          <div 
            ref={progressRef}
            className="w-full h-1 md:h-1.5 bg-white/30 cursor-pointer relative group/progress"
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary z-10 pointer-events-none" 
              style={{ width: `${progress}%` }}
            />
            {/* Scrubber knob */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full z-20 shadow-lg scale-0 group-hover/progress:scale-100 transition-transform origin-center pointer-events-none"
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

          {/* Bottom Control Bar */}
          <div className="flex items-center justify-between mt-2 md:mt-3">
            <div className="flex items-center gap-4 md:gap-6">
              <button onClick={handlePlayPause} className="text-white hover:text-white/80 transition-colors">
                {isPlaying ? <BoxyPause size={28} fill="currentColor" /> : <BoxyPlay size={28} fill="currentColor" />}
              </button>
              
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                  {isMuted || volume === 0 ? <BoxyVolumeX size={24} /> : <BoxyVolume size={24} fill="currentColor" />}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 md:w-20 transition-all duration-300 flex items-center">
                  <div 
                    ref={volumeRef}
                    className="w-full h-1 bg-white/30 cursor-pointer relative group/volbar"
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-white z-10 pointer-events-none" 
                      style={{ width: `${volume * 100}%` }}
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full z-20 shadow-lg scale-0 group-hover/volbar:scale-100 transition-transform origin-center pointer-events-none"
                      style={{ left: `calc(${volume * 100}% - 5px)` }}
                    />
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
                      className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-30"
                    />
                  </div>
                </div>
              </div>

              <div className="text-white text-[12px] md:text-sm font-medium tracking-tight font-mono select-none">
                {formatTime(currentTime)} <span className="opacity-50 mx-1">/</span> {formatTime(duration)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomVideoPlayer;
