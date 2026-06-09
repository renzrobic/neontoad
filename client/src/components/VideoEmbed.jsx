import React, { useState, useRef, useEffect } from 'react';
import { BoxyTV, BoxyPlay } from './ui/BoxyIcons';
import CustomVideoPlayer from './anime/CustomVideoPlayer';

const VideoEmbed = ({ sourceUrl, isFullscreen = false, nextEpisode, onPlayNext, onProgress, initialTime = 0, skipTimes, topControls }) => {
 const [loading, setLoading] = useState(true);
 const [showNextPrompt, setShowNextPrompt] = useState(false);
 const [showSkipIntro, setShowSkipIntro] = useState(false);
 const [hasError, setHasError] = useState(false);
 const videoRef = useRef(null);
 const hasAutoPlayedRef = useRef(false);
 const [skipAnim, setSkipAnim] = useState(null);

 const skipTime = (amount) => {
 if (videoRef.current) {
 videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + amount);
 setSkipAnim(amount > 0 ? 'forward' : 'backward');
 setTimeout(() => setSkipAnim(null), 600);
 }
 };

 useEffect(() => {
 const handleKeyDown = (e) => {
 if (!videoRef.current) return;
 if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
 if (e.key === 'ArrowRight') {
 e.preventDefault();
 skipTime(10);
 } else if (e.key === 'ArrowLeft') {
 e.preventDefault();
 skipTime(-10);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 useEffect(() => {
 setLoading(true);
 setHasError(false);
 setShowNextPrompt(false);
 hasAutoPlayedRef.current = false;
 
 // Safety timeout: if the video or iframe takes too long to load (or is blocked by an extension),
 // remove the loading spinner after 8 seconds so the user isn't stuck forever.
 const timer = setTimeout(() => {
 setLoading(false);
 }, 8000);

 return () => clearTimeout(timer);
 }, [sourceUrl]);

 const handleTimeUpdate = (e) => {
 const { currentTime, duration } = e.target;
 if (onProgress) onProgress(currentTime, duration);
 // Show prompt 15 seconds before the end if there is a next episode
 if (duration > 0 && duration - currentTime <= 15 && nextEpisode) {
 if (!showNextPrompt) setShowNextPrompt(true);
 } else {
 if (showNextPrompt) setShowNextPrompt(false);
 }

 if (skipTimes) {
 if (skipTimes.op && currentTime >= skipTimes.op.startTime && currentTime <= skipTimes.op.endTime) {
 if (!showSkipIntro) setShowSkipIntro(true);
 } else {
 if (showSkipIntro) setShowSkipIntro(false);
 }

 if (skipTimes.ed && currentTime >= skipTimes.ed.startTime && currentTime <= skipTimes.ed.endTime) {
 if (nextEpisode && onPlayNext && !hasAutoPlayedRef.current) {
 hasAutoPlayedRef.current = true;
 onPlayNext();
 }
 }
 }
 };

 const handleEnded = () => {
 if (nextEpisode && onPlayNext) {
 onPlayNext();
 }
 };

 const { embedUrl, isDirectVideo } = React.useMemo(() => {
 if (!sourceUrl) return { embedUrl: '', isDirectVideo: false };

 let url = sourceUrl;
 
 // YouTube
 if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
 const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
 const match = sourceUrl.match(regExp);
 const id = (match && match[2].length === 11) ? match[2] : null;
 url = `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0&origin=${window.location.origin}`;
 }
 // Dailymotion
 else if (sourceUrl.includes('dailymotion.com') || sourceUrl.includes('dai.ly')) {
 const id = sourceUrl.split('/').pop();
 url = `https://www.dailymotion.com/embed/video/${id}?ui-logo=0`;
 }
 // Google Drive
 else if (sourceUrl.includes('drive.google.com')) {
 url = sourceUrl.replace('/view', '/preview');
 }

 return {
 embedUrl: url,
 isDirectVideo: !!url.match(/\.(mp4|webm|ogg)(\?.*|#.*)?$/i)
 };
 }, [sourceUrl]);

 return (
 <div className={`relative w-full ${isFullscreen ? 'h-full' : 'aspect-video'} bg-black rounded-none overflow-hidden group`}>
 {loading && embedUrl && !hasError && (
 <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
 <div className="flex flex-col items-center justify-center">
 <div style={{ borderRadius: '50%' }} className="w-12 h-12 border-4 border-t-white animate-spin mb-6" />
 <div className="h-2 w-32 bg-neutral-900" />
 </div>
 </div>
 )}

  {hasError && (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 text-white/90">
  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
  <BoxyTV className="text-white/50" size={32} />
  </div>
  <span className="tracking-tight text-micro font-medium">Stream Unavailable</span>
  <span className="text-[11px] mt-2 text-white/50 font-normal">We're having trouble loading this video. Please try another source.</span>
  </div>
  )}

 {embedUrl ? (
 isDirectVideo ? (
          <CustomVideoPlayer
            ref={videoRef}
            key={`vid-${embedUrl}`}
            src={embedUrl}
            initialTime={initialTime}
            skipAnim={skipAnim}
            topControls={topControls}
            onLoadedData={() => setLoading(false)}
            onError={() => { setLoading(false); setHasError(true); }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onPlay={(e) => {
              try {
                if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
                  window.screen.orientation.lock('landscape').catch(() => {});
                }
              } catch (err) {}
            }}
          >
            {showSkipIntro && skipTimes?.op && (
              <div className="absolute bottom-24 right-8 z-40 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto">
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = skipTimes.op.endTime; setShowSkipIntro(false); }} className="bg-neutral-800 hover:bg-white text-white hover:text-black backdrop-blur-md px-4 py-2 text-[12px] font-bold tracking-widest uppercase transition-all shadow-xl flex items-center gap-2">
                  Skip Intro <BoxyPlay size={14} fill="currentColor" />
                </button>
              </div>
            )}
            {showNextPrompt && nextEpisode && (
              <div className="absolute bottom-24 right-8 z-50 flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right-8 duration-500 pointer-events-auto">
                <div className="text-white/90 text-micro font-semibold tracking-widest uppercase bg-black/80 px-4 py-2 rounded-none backdrop-blur-md shadow-2xl">
                  Up next: {nextEpisode.title || `Episode ${nextEpisode.episodeNumber}`}
                </div>
                <button 
                  onClick={onPlayNext}
                  className="flex items-center gap-3 bg-white text-black px-6 py-4 font-bold text-micro tracking-tight hover:scale-105 transition-all rounded-none shadow-xl"
                >
                  <BoxyPlay size={20} fill="currentColor" /> Play Next Episode
                </button>
              </div>
            )}
          </CustomVideoPlayer>
 ) : (
 <iframe
 key={`ifr-${embedUrl}`}
 src={embedUrl}
 onLoad={() => setLoading(false)}
 onError={() => setLoading(false)}
 className="absolute top-0 left-0 w-full h-full border-0"
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 title="Anime Video Player"
 />
 )
 ) : (
  <div className="flex flex-col items-center justify-center h-full text-white bg-background px-4 text-center">
  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
  <BoxyTV className="text-white/50" size={32} />
  </div>
  <span className="tracking-tight text-micro font-medium">Source Disconnected</span>
  <span className="text-[11px] mt-2 text-white/50 font-normal">This video source is currently unavailable.</span>
  </div>
 )}
 {!isDirectVideo && showNextPrompt && nextEpisode && (
 <div className="absolute bottom-24 right-8 z-50 flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right-8 duration-500">
 <div className="text-white/90 text-micro font-semibold tracking-widest uppercase bg-black/80 px-4 py-2 rounded-none backdrop-blur-md shadow-2xl">
 Up next: {nextEpisode.title || `Episode ${nextEpisode.episodeNumber}`}
 </div>
 <button 
 onClick={onPlayNext}
 className="flex items-center gap-3 bg-white text-black px-6 py-4 font-bold text-micro tracking-tight hover:scale-105 transition-all rounded-none shadow-xl"
 >
 <BoxyPlay size={20} fill="currentColor" /> Play Next Episode
 </button>
 </div>
 )}
 </div>
 );
};

export default VideoEmbed;
