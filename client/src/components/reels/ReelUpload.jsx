import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoxyX, BoxyPlus, BoxyCheck, BoxyAlert } from '../ui/BoxyIcons';
import { collection, addDoc, serverTimestamp, query, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const ReelUpload = ({ onClose, onComplete }) => {
 const [file, setFile] = useState(null);
 const [videoTitle, setVideoTitle] = useState('');
 const [caption, setCaption] = useState('');
 const [animeTitle, setAnimeTitle] = useState('');
 const [uploading, setUploading] = useState(false);
 const [progress, setProgress] = useState(0);
 const [error, setError] = useState('');
 const { activeProfile, isBanned } = useAuth();
 const fileInputRef = useRef(null);

 const MAX_DURATION = 60;

 const [videoDuration, setVideoDuration] = useState(0);
 const [startOffset, setStartOffset] = useState(0);
 const [trimDuration, setTrimDuration] = useState(0);
 const [panX, setPanX] = useState(50);
 const [isPlaying, setIsPlaying] = useState(true);
 const [videoPreview, setVideoPreview] = useState(null);
 const [allAnime, setAllAnime] = useState([]);
 const [suggestions, setSuggestions] = useState([]);
 const [showSuggestions, setShowSuggestions] = useState(false);
 const [selectedAnime, setSelectedAnime] = useState(null);
 const videoRef = useRef(null);

 useEffect(() => {
 const fetchAnime = async () => {
 const q = query(collection(db, 'anime'));
 const snapshot = await getDocs(q);
 const data = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
 setAllAnime(data);
 };
 fetchAnime();
 }, []);

 const handleAnimeSearch = (val) => {
 setAnimeTitle(val);
 if (val.trim().length > 0) {
 const filtered = allAnime.filter(a => a.title.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
 setSuggestions(filtered);
 setShowSuggestions(true);
 } else {
 setSuggestions([]);
 setShowSuggestions(false);
 }
 };

 const selectAnime = (anime) => {
 setAnimeTitle(anime.title);
 setSelectedAnime(anime);
 setShowSuggestions(false);
 };

 const validateVideo = (file) => {
 return new Promise((resolve) => {
 const video = document.createElement('video');
 video.preload = 'metadata';
 video.onloadedmetadata = () => {
 setVideoDuration(video.duration);
 setTrimDuration(Math.min(video.duration, MAX_DURATION));
 window.URL.revokeObjectURL(video.src);
 resolve({ valid: true });
 };
 video.src = URL.createObjectURL(file);
 });
 };

 const handleFileChange = async (e) => {
 const selectedFile = e.target.files[0];
 if (!selectedFile) return;
 setError('');
 const validation = await validateVideo(selectedFile);
 if (validation.valid) {
 setFile(selectedFile);
 setVideoPreview(URL.createObjectURL(selectedFile));
 setStartOffset(0);
 setPanX(50);
 }
 };

 const togglePlay = () => {
 if (videoRef.current) {
 if (isPlaying) videoRef.current.pause();
 else videoRef.current.play();
 setIsPlaying(!isPlaying);
 }
 };

 const handleTimeUpdate = () => {
 if (!videoRef.current) return;
 const current = videoRef.current.currentTime;
 if (current > startOffset + trimDuration || current < startOffset) {
 videoRef.current.currentTime = startOffset;
 }
 };

 useEffect(() => {
 if (videoRef.current) {
 videoRef.current.currentTime = startOffset;
 }
 }, [startOffset, trimDuration]);

 const handleUpload = async () => {
 if (isBanned) {
 toast.error('You are banned from uploading reels.');
 return;
 }
 if (!file || !caption || !animeTitle) return;
 setUploading(true);
 setError('');

 if (!videoRef.current) return;
 const video = videoRef.current;

 // Fast-forward to user's selected start time
 video.currentTime = startOffset;
 video.muted = false; // Ensure audio is captured if unmuted
 await video.play();

 const mimeTypes = [
 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264
 'video/mp4',
 'video/webm;codecs=h264,opus',
 'video/webm;codecs=vp8,opus',
 'video/webm'
 ];
 let mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

 // Set up a hidden canvas to draw the cropped frame
 const canvas = document.createElement('canvas');
 canvas.width = 720;
 canvas.height = 1280;
 const ctx = canvas.getContext('2d');

 // Calculate source crop coordinates based on panX slider
 const vw = video.videoWidth;
 const vh = video.videoHeight;
 const targetRatio = 9 / 16;
 const sourceRatio = vw / vh;
 
 let sWidth, sHeight, sx, sy;
 if (sourceRatio > targetRatio) { // Landscape
 sHeight = vh;
 sWidth = vh * targetRatio;
 const maxSx = vw - sWidth;
 sx = maxSx * (panX / 100);
 sy = 0;
 } else { // Vertical
 sWidth = vw;
 sHeight = vw / targetRatio;
 sx = 0;
 const maxSy = vh - sHeight;
 sy = maxSy / 2; 
 }

 const canvasStream = canvas.captureStream(30); // 30 FPS

 // Add audio track from original video
 const videoStream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
 const audioTracks = videoStream.getAudioTracks();
 if (audioTracks.length > 0) {
 canvasStream.addTrack(audioTracks[0]);
 }

 const mediaRecorder = new MediaRecorder(canvasStream, { 
 mimeType,
 videoBitsPerSecond: 3000000 // 3 Mbps to prevent low-quality glitches on mobile
 });
 const chunks = [];
 
 let isRecording = false;

 // Animation loop to push video frames to canvas
 const draw = () => {
 if (!isRecording) return;
 ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, 720, 1280);
 
 // Use requestVideoFrameCallback for exact frame timing if available (highly performant)
 if ('requestVideoFrameCallback' in video) {
 video.requestVideoFrameCallback(draw);
 } else {
 // Fallback to 30fps throttle instead of 60fps requestAnimationFrame to save mobile GPU
 setTimeout(draw, 1000 / 30);
 }
 };

 mediaRecorder.ondataavailable = (e) => {
 if (e.data.size > 0) chunks.push(e.data);
 };

 mediaRecorder.onstop = async () => {
 isRecording = false;
 video.pause();
 const trimmedBlob = new Blob(chunks, { type: mimeType });
 const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
 await uploadToCloudinary(trimmedBlob, ext);
 };

 // Start recording
 isRecording = true;
 mediaRecorder.start();
 draw();

 // Stop recording exactly after the trim duration
 setTimeout(() => {
 if (mediaRecorder.state === 'recording') {
 mediaRecorder.stop();
 }
 }, trimDuration * 1000);
 };

 const uploadToCloudinary = async (trimmedBlob, ext = 'webm') => {
 try {
 const formData = new FormData();
 formData.append('file', trimmedBlob, `reel.${ext}`);
 formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
 formData.append('resource_type', 'video');

 const xhr = new XMLHttpRequest();
 xhr.open('POST', `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, true);

 xhr.upload.onprogress = (e) => setProgress((e.loaded / e.total) * 100);

 xhr.onload = async () => {
 try {
 const response = JSON.parse(xhr.responseText);
 if (xhr.status === 200) {
 const finalUrl = response.secure_url; // We no longer need c_fill here because we upload a perfect 9:16 Canvas!

 let finalAnimeId = selectedAnime?.id || null;
 if (!finalAnimeId && animeTitle) {
 const matchedAnime = allAnime.find(a => a.title.toLowerCase() === animeTitle.toLowerCase());
 if (matchedAnime) finalAnimeId = matchedAnime.id;
 }

 const newReelRef = await addDoc(collection(db, 'reels'), {
 url: finalUrl,
 caption,
 animeTitle: selectedAnime?.title || animeTitle,
 animeId: finalAnimeId,
 userId: auth.currentUser?.uid,
 userName: activeProfile?.name || 'User',
 userAvatar: activeProfile?.avatarUrl || '',
 createdAt: serverTimestamp()
 });

 // Notify followers
 try {
 if (auth.currentUser) {
 const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
 if (userDoc.exists()) {
 const followers = userDoc.data().followers || [];
 if (followers.length > 0) {
 const notifyPromises = followers.map(followerId => 
 addDoc(collection(db, 'notifications'), {
 recipientId: followerId,
 actorId: auth.currentUser.uid,
 actorName: activeProfile?.name || auth.currentUser.displayName || 'User',
 actorAvatar: activeProfile?.avatarUrl || auth.currentUser.photoURL || '',
 type: 'reel',
 targetId: newReelRef.id,
 targetPath: `/reel/${newReelRef.id}`,
 message: `posted a new reel:"${caption.substring(0, 20)}..."`,
 createdAt: serverTimestamp(),
 readBy: []
 })
 );
 await Promise.all(notifyPromises);
 }
 }
 }
 } catch (notifyErr) {
 console.error("Failed to notify followers:", notifyErr);
 }

 onComplete();
 onClose();
 } else {
 const errorMsg = response.error?.message ||"Upload failed";
 setError(errorMsg);
 }
 } catch (parseErr) {
 setError("Upload failed: Invalid server response.");
 }
 setUploading(false);
 };

 xhr.onerror = () => {
 setError("Network error during upload.");
 setUploading(false);
 };

 xhr.send(formData);
 } catch (err) {
 console.error('Upload catch error:', err);
 setError("Error sharing reel");
 setUploading(false);
 }
 };

 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[200] bg-transparent flex items-center justify-center p-0 md:p-6 lg:p-10"
 >
 <div className="w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-5xl bg-[#0a0a0a] relative flex flex-col lg:flex-row border-0 lg: lg: shadow-2xl overflow-y-auto lg:overflow-hidden">
 <button
 onClick={onClose}
 className="absolute top-6 right-6 z-[300] text-white/90 hover:text-white transition-colors p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 backdrop-blur-md rounded-xl"
 >
 <BoxyX size={14} />
 </button>

 {/* Studio Viewport */}
 <div className="w-full lg:w-1/2 bg-transparent flex flex-col items-center justify-center p-8 lg:p-12 lg:border-b-0 lg: relative flex-shrink-0 min-h-[500px] lg:min-h-0">
 <div className="absolute top-8 left-8 lg:top-12 lg:left-12 space-y-1 z-50">
 <h2 className="text-h4 lg:text-h3 font-medium text-white tracking-tight">Studio</h2>
 <p className="text-[10px] font-medium text-white/90 tracking-tight">Final cut</p>
 </div>

 <div className="relative aspect-[9/16] w-full max-w-[260px] lg:max-w-[300px] bg-neutral-900/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl mt-12 lg:mt-16">
 {file ? (
 <div className="w-full h-full relative">
 <video
 ref={videoRef}
 src={videoPreview}
 className="w-full h-full object-cover transition-all duration-300"
 style={{ objectPosition: `${panX}% center` }}
 autoPlay
 muted
 onTimeUpdate={handleTimeUpdate}
 />

 <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20">
 <button
 onClick={togglePlay}
 className="w-full py-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 rounded-xl text-[11px] font-semibold text-white hover:bg-white hover:text-background transition-all tracking-tight"
 >
 {isPlaying ? 'Pause' : 'Play Preview'}
 </button>
 </div>
 </div>
 ) : (
 <div className="w-full h-full flex flex-col items-center justify-center gap-6 group cursor-pointer bg-white/[0.01]">
 <div className="w-16 h-16 flex items-center justify-center group-hover: transition-all rounded-full bg-white/[0.02]">
 <BoxyPlus size={24} className="text-white/90 group-hover:text-white" />
 </div>
 <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer rounded-xl bg-white/5 backdrop-blur-md border border-white/10" />
 <div className="text-center space-y-2">
 <p className="text-[11px] font-medium text-white tracking-tight">Import Footage</p>
 <p className="text-[9px] text-white/90 tracking-tight">Record or pick video</p>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Controls & Metadata */}
 <div className="flex-1 p-8 lg:p-16 flex flex-col justify-between bg-[#0a0a0a]">
 <div className="space-y-10 lg:space-y-12">
 {file && (
 <div className="space-y-8 lg:space-y-10">
 <div className="space-y-4">
 <div className="flex justify-between text-[10px] font-medium text-white/90 tracking-tight uppercase">
 <span>Pan Focus (Landscape)</span>
 <span className="text-white font-medium">{panX}%</span>
 </div>
 <input
 type="range" min="0" max="100" step="1" value={panX}
 onChange={(e) => setPanX(parseFloat(e.target.value))}
 className="w-full h-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 appearance-none cursor-pointer accent-white"
 />
 <div className="flex justify-between text-[9px] text-white/90">
 <span>Left</span>
 <span>Center</span>
 <span>Right</span>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between text-[10px] font-medium text-white/90 tracking-tight uppercase">
 <span>Clip Duration</span>
 <span className="text-white font-medium">{trimDuration.toFixed(1)}s</span>
 </div>
 <input
 type="range" min="0.5" max={Math.min(videoDuration, MAX_DURATION)} step="0.1" value={trimDuration}
 onChange={(e) => setTrimDuration(parseFloat(e.target.value))}
 className="w-full h-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 appearance-none cursor-pointer accent-white"
 />
 </div> <div className="space-y-4">
 <div className="flex justify-between text-[9px] font-medium tracking-tight text-white/90">
 <span>Start Time: {startOffset.toFixed(1)}s</span>
 </div>
 <div className="relative h-12 bg-transparent rounded-xl overflow-hidden">
 <div className="absolute inset-0 flex opacity-10">
 {[...Array(15)].map((_, i) => <div key={i} className="flex-1" />)}
 </div>
 <motion.div
 className="absolute h-full bg-white/10 backdrop-blur-md rounded-xl border-x"
 style={{
 left: `${(startOffset / videoDuration) * 100}%`,
 width: `${(trimDuration / videoDuration) * 100}%`
 }}
 />
 <input
 type="range" min="0" max={Math.max(0, videoDuration - trimDuration)} step="0.01" value={startOffset}
 onChange={(e) => setStartOffset(parseFloat(e.target.value))}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 />
 </div>
 </div>
 </div>
 )}

 <div className="space-y-8">
 <div className="space-y-4 relative">
 <label className="text-[10px] font-medium text-white/90 tracking-tight uppercase">Link anime</label>
 <input
 type="text" value={animeTitle}
 onChange={(e) => handleAnimeSearch(e.target.value)}
 onFocus={() => animeTitle && setShowSuggestions(true)}
 placeholder="Which series?"
 className="w-full bg-transparent py-3 text-body lg:text-h4 text-white font-medium focus: focus:outline-none transition-all placeholder:text-white/90 tracking-tight"
 />
 <AnimatePresence>
 {showSuggestions && suggestions.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: -5 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -5 }}
 className="absolute left-0 right-0 top-full mt-2 bg-background z-[300] shadow-2xl rounded-xl overflow-hidden"
 >
 {suggestions.map(anime => (
 <button
 key={anime.id}
 onClick={() => selectAnime(anime)}
 className="w-full p-4 text-left text-micro font-medium text-white/90 hover:text-white hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 transition-all flex justify-between items-center tracking-tight"
 >
 {anime.title}
 <BoxyCheck size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
 </button>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-medium text-white/90 tracking-tight uppercase">Caption</label>
 <textarea
 value={caption} onChange={(e) => setCaption(e.target.value)}
 placeholder="What's the context?"
 className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-5 text-white font-medium h-32 lg:h-44 focus: focus:outline-none transition-all resize-none placeholder:text-white/90 rounded-xl text-body tracking-tight"
 />
 </div>
 </div>
 </div>

 <div className="pt-10 lg:pt-12 space-y-6">
 {uploading ? (
 <div className="space-y-4">
 <div className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 h-[2px] rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 className="bg-white/80 h-full shadow-xl"
 />
 </div>
 <p className="text-[10px] font-semibold text-white/90 text-center animate-pulse tracking-tight">Performing its magic... {Math.round(progress)}%</p>
 <p className="text-[10px] font-medium text-yellow-500/80 text-center tracking-tight mt-1">Please do not switch tabs while processing.</p>
 </div>
 ) : (
 <button onClick={handleUpload}
 disabled={!file || !caption || !animeTitle}
 className="w-full bg-white/90 text-background font-semibold py-5 hover:bg-white transition-all disabled:opacity-5 disabled:cursor-not-allowed text-micro shadow-xl tracking-tight rounded-xl"
 >
 Publish to feed
 </button>
 )}
 </div>
 </div>
 </div>
 </motion.div>
 );
};

export default ReelUpload;
