import React, { useRef, useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
 BoxyHeart, BoxyMessage, BoxyShare, BoxyPlay, BoxyPause, BoxyPlus, BoxyX,
 BoxyHome, BoxyTV, BoxyVolume, BoxyVolumeX, BoxyMoreVertical, BoxyShield,
 BoxyChevron, BoxyBookmark, BoxyThumbsUp, BoxyReels
} from '../components/ui/BoxyIcons';
import { useNavigate, useParams } from 'react-router-dom';
import {
 collection, query, getDocs, orderBy, limit, updateDoc, doc,
 arrayUnion, arrayRemove, increment, addDoc, serverTimestamp,
 onSnapshot, startAfter, getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import SkeletonReel from '../components/skeletons/SkeletonReel';
const ReelUpload = lazy(() => import('../components/reels/ReelUpload'));
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
 COMMENTS DRAWER (unchanged logic, refreshed UI)
───────────────────────────────────────────── */
const CommentsDrawer = ({ reelId, reelAuthorId, onClose, onUpdateCount }) => {
 const { activeProfile, isBanned } = useAuth();
 const [comments, setComments] = useState([]);
 const [newComment, setNewComment] = useState('');
 const [isSpoiler, setIsSpoiler] = useState(false);
 const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());
 const [loading, setLoading] = useState(true);
 const [replyingTo, setReplyingTo] = useState(null);

 useEffect(() => {
 const q = query(collection(db, 'reels', reelId, 'comments'), orderBy('createdAt', 'desc'));
 const unsub = onSnapshot(q, snap => {
 const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
 setComments(data);
 if (onUpdateCount) onUpdateCount(data.length);
 setLoading(false);
 });
 return () => unsub();
 }, [reelId, onUpdateCount]);

 const handlePostComment = async e => {
 e.preventDefault();
 if (!auth.currentUser || !newComment.trim()) return;
 if (isBanned) { toast.error('You are banned from interacting.'); return; }
 try {
 const parentId = replyingTo?.id || null;
 const replyToUserId = replyingTo?.userId || null;
 await addDoc(collection(db, 'reels', reelId, 'comments'), {
 text: newComment,
 userId: auth.currentUser.uid,
 userName: activeProfile?.name || auth.currentUser.displayName || 'User',
 userEmail: auth.currentUser.email || '',
 userAvatar: activeProfile?.avatarUrl || auth.currentUser.photoURL || 'https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg',
 likes: 0, likedBy: [], parentId, isSpoiler, createdAt: serverTimestamp()
 });
 await updateDoc(doc(db, 'reels', reelId), { comments: increment(1) });
 if (replyToUserId && replyToUserId !== auth.currentUser.uid) {
 await addDoc(collection(db, 'notifications'), {
 recipientId: replyToUserId, actorId: auth.currentUser.uid,
 actorName: auth.currentUser.displayName || 'User', actorAvatar: auth.currentUser.photoURL || '',
 type: 'reply', targetId: reelId, targetPath: '/reel',
 message: `replied to your comment:"${newComment.substring(0, 20)}..."`,
 createdAt: serverTimestamp(), readBy: []
 });
 } else if (!replyToUserId && auth.currentUser.uid !== reelAuthorId) {
 await addDoc(collection(db, 'notifications'), {
 recipientId: reelAuthorId, actorId: auth.currentUser.uid,
 actorName: auth.currentUser.displayName || 'User', actorAvatar: auth.currentUser.photoURL || '',
 type: 'comment', targetId: reelId, targetPath: '/reel',
 message: `commented on your reel:"${newComment.substring(0, 20)}..."`,
 createdAt: serverTimestamp(), readBy: []
 });
 }
 setNewComment(''); setIsSpoiler(false); setReplyingTo(null);
 } catch (err) { console.error('Comment error:', err); toast.error('An error occurred while commenting.'); }
 };

 const toggleLikeComment = async (commentId, likedBy = []) => {
 if (!auth.currentUser) return;
 const isLiked = likedBy.includes(auth.currentUser.uid);
 await updateDoc(doc(db, 'reels', reelId, 'comments', commentId), {
 likedBy: isLiked ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid),
 likes: increment(isLiked ? -1 : 1)
 });
 };

 const topLevelComments = comments.filter(c => !c.parentId);
 const getReplies = parentId => comments.filter(c => c.parentId === parentId).reverse();

 return (
 <motion.div
 initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
 transition={{ type: 'spring', damping: 32, stiffness: 320 }}
 className="fixed inset-x-0 bottom-0 h-[78vh] lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:h-full bg-black/70 backdrop-blur-3xl lg:border-t-0 lg: z-[200] flex flex-col shadow-2xl"
 >
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
 <h3 className="font-semibold text-white text-[15px]">{comments.length} Comments</h3>
 <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-neutral-800 rounded-full transition-all">
 <BoxyX size={18} />
 </button>
 </div>

 {/* Comment list */}
 <div className="flex-grow overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
 {loading ? (
 <div className="space-y-5">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="flex gap-3 animate-pulse">
 <div className="w-8 h-8 rounded-full bg-white/8 flex-shrink-0" />
 <div className="flex-grow space-y-2">
 <div className="h-3 w-20 bg-neutral-800 rounded" />
 <div className="h-3 w-full bg-white/6 rounded" />
 </div>
 </div>
 ))}
 </div>
 ) : topLevelComments.length > 0 ? (
 topLevelComments.map(c => (
 <div key={c.id}>
 <div className="flex gap-3 items-start group">
 <img
 loading="lazy"
 src={c.userId === auth.currentUser?.uid && activeProfile?.avatarUrl ? activeProfile.avatarUrl : c.userAvatar}
 className="w-8 h-8 rounded-full object-cover flex-shrink-0"
 alt=""
 />
 <div className="flex-grow min-w-0">
 <div className="flex items-center gap-1.5 mb-0.5">
 <span className="text-[12px] font-semibold text-white/90">
 {c.userId === auth.currentUser?.uid && activeProfile?.name ? activeProfile.name : c.userName}
 </span>
 {c.userId === reelAuthorId && <span className="text-[9px] font-bold bg-neutral-800 text-white/90 px-1.5 py-0.5 rounded-full">OP</span>}
 <span className="text-[10px] text-white/90 font-medium">{c.createdAt?.toDate ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</span>
 </div>
 <p
 className={`text-[13px] font-medium leading-relaxed ${c.isSpoiler && !revealedSpoilers.has(c.id) ? 'blur-sm cursor-pointer select-none text-white/90' : 'text-white/85'}`}
 onClick={() => { if (c.isSpoiler) { const s = new Set(revealedSpoilers); s.add(c.id); setRevealedSpoilers(s); } }}
 >
 {c.isSpoiler && !revealedSpoilers.has(c.id) ? 'Spoiler — tap to reveal' : c.text}
 </p>
 <button onClick={() => setReplyingTo({ id: c.id, userName: c.userName, userId: c.userId })}
 className="text-[11px] font-semibold text-white/90 hover:text-white/90 mt-1 transition-colors">Reply</button>
 </div>
 <button onClick={() => toggleLikeComment(c.id, c.likedBy)} className={`pt-1 flex-shrink-0 transition-all ${c.likedBy?.includes(auth.currentUser?.uid) ? 'text-white' : 'text-white/25 hover:text-white/90'}`}>
 <BoxyHeart size={14} fill={c.likedBy?.includes(auth.currentUser?.uid) ? 'currentColor' : 'none'} />
 <span className="text-[10px] font-bold block text-center mt-0.5">{c.likes || 0}</span>
 </button>
 </div>
 {/* Replies */}
 {getReplies(c.id).map(r => (
 <div key={r.id} className="flex gap-3 items-start ml-11 mt-3 pl-3">
 <img loading="lazy" src={r.userId === auth.currentUser?.uid && activeProfile?.avatarUrl ? activeProfile.avatarUrl : r.userAvatar}
 className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />
 <div className="flex-grow min-w-0">
 <div className="flex items-center gap-1.5 mb-0.5">
 <span className="text-[11px] font-semibold text-white/90">
 {r.userId === auth.currentUser?.uid && activeProfile?.name ? activeProfile.name : r.userName}
 </span>
 <span className="text-[9px] text-white/25">{r.createdAt?.toDate ? formatDistanceToNow(r.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</span>
 </div>
 <p className={`text-[12px] font-medium leading-relaxed ${r.isSpoiler && !revealedSpoilers.has(r.id) ? 'blur-sm cursor-pointer select-none text-white/90' : 'text-white/90'}`}
 onClick={() => { if (r.isSpoiler) { const s = new Set(revealedSpoilers); s.add(r.id); setRevealedSpoilers(s); } }}>
 {r.isSpoiler && !revealedSpoilers.has(r.id) ? 'Spoiler — tap to reveal' : r.text}
 </p>
 </div>
 </div>
 ))}
 </div>
 ))
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-white/90 gap-3 pt-16">
 <BoxyMessage size={36} className="opacity-20" />
 <p className="text-[12px] font-medium text-white/90">No comments yet. Start the conversation!</p>
 </div>
 )}
 </div>

 {/* Reply indicator */}
 {replyingTo && (
 <div className="px-4 py-2 bg-neutral-900 flex items-center justify-between flex-shrink-0">
 <span className="text-[11px] font-medium text-white/90">Replying to <span className="text-white/90 font-semibold">@{replyingTo.userName}</span></span>
 <button onClick={() => setReplyingTo(null)} className="text-white/90 hover:text-white transition-colors">
 <BoxyX size={14} />
 </button>
 </div>
 )}

 {/* Spoiler toggle + Input */}
 <div className="px-4 py-3 bg-black/30 flex-shrink-0 safe-bottom">
 <div className="flex items-center gap-3">
 <img loading="lazy"
 src={activeProfile?.avatarUrl || auth.currentUser?.photoURL || 'https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg'}
 className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt=""
 />
 <form onSubmit={handlePostComment} className="flex-grow flex items-center gap-2 bg-white/8 rounded-full px-4 py-2 focus-within: transition-all">
 <input
 type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
 placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
 className="flex-grow bg-transparent text-[13px] font-medium text-white focus:outline-none placeholder:text-white/90 tracking-tight min-w-0"
 />
 <button
 type="button" onClick={() => setIsSpoiler(!isSpoiler)}
 className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${isSpoiler ? 'bg-neutral-700 text-white' : 'text-white/90 hover:text-white/90'}`}
 >
 {isSpoiler ? '⚠ Spoiler' : 'Spoiler'}
 </button>
 <button type="submit" disabled={!newComment.trim()}
 className="flex-shrink-0 text-[12px] font-bold text-white disabled:opacity-25 hover:text-white/90 transition-colors">
 Post
 </button>
 </form>
 </div>
 </div>
 </motion.div>
 );
};

/* ─────────────────────────────────────────────
 REEL CARD — Facebook Reels style
───────────────────────────────────────────── */
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
 // Controls only show when user taps; auto-hide after 3 seconds
 const [showControls, setShowControls] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [isDragging, setIsDragging] = useState(false);
 const [commentsCount, setCommentsCount] = useState(video.comments || 0);

 useEffect(() => {
 setCommentsCount(video.comments || 0);
 }, [video.comments]);

 // View counter
 useEffect(() => {
 if (isActive && !viewCounted) {
 updateDoc(doc(db, 'reels', video.id), { views: increment(1) })
 .then(() => setViewCounted(true))
 .catch(err => console.error('Error incrementing views:', err));
 }
 }, [isActive, viewCounted, video.id]);

 // Sync volume
 useEffect(() => {
 if (desktopVideoRef.current) desktopVideoRef.current.volume = volume;
 if (mobileVideoRef.current) mobileVideoRef.current.volume = volume;
 }, [volume]);

 // Play/pause management
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

 // Auto-hide controls after 3s
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

 /* ── RIGHT ACTION COLUMN (shared mobile/desktop) ── */
 const renderActionColumn = (circular = false) => (
 <div className={`flex flex-col items-center ${circular ? 'gap-5' : 'gap-6'}`}>
 {/* Like */}
 <button
 onClick={handleLike}
 className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}
 >
 <div className={`${circular ? 'w-12 h-12 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
 <BoxyHeart
 size={circular ? 22 : 26}
 fill={liked ? 'currentColor' : 'none'}
 className={liked ? 'text-white' : 'text-white/85 drop-shadow-md'}
 />
 </div>
 <span className="text-[12px] font-bold text-white drop-shadow-md">{likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}</span>
 </button>

 {/* Comment */}
 <button
 onClick={e => { e.stopPropagation(); setShowComments(true); }}
 className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}
 >
 <div className={`${circular ? 'w-12 h-12 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
 <BoxyMessage size={circular ? 22 : 26} className="text-white/85 drop-shadow-md" />
 </div>
 <span className="text-[12px] font-bold text-white drop-shadow-md">{commentsCount}</span>
 </button>

 {/* Share */}
 <button
 onClick={e => { e.stopPropagation(); handleShare(); }}
 className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}
 >
 <div className={`${circular ? 'w-12 h-12 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
 <BoxyShare size={circular ? 22 : 26} className="text-white/85 drop-shadow-md" />
 </div>
 <span className="text-[12px] font-bold text-white drop-shadow-md">Share</span>
 </button>

 {/* More */}
 <div className="relative">
 <button
 onClick={e => { e.stopPropagation(); setShowMoreMenu(m => !m); }}
 className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${circular ? '' : 'hover:scale-110'}`}
 >
 <div className={`${circular ? 'w-12 h-12 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-neutral-700' : ''} flex items-center justify-center transition-all`}>
 <BoxyMoreVertical size={circular ? 22 : 26} className="text-white/85 drop-shadow-md" />
 </div>
 </button>
 <AnimatePresence>
 {showMoreMenu && (
 <motion.div
 initial={{ opacity: 0, scale: 0.85, y: 8 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.85, y: 8 }}
 className="absolute bottom-full right-full mb-2 mr-2 bg-black/70 backdrop-blur-xl shadow-2xl rounded-none overflow-hidden min-w-[140px] z-50"
 >
 <button
 onClick={e => { e.stopPropagation(); handleReport(); setShowMoreMenu(false); }}
 className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-white/90 hover:bg-neutral-800 transition-colors text-left"
 >
 <BoxyShield size={16} /> Report
 </button>
 {video.animeId && (
 <button
 onClick={e => { e.stopPropagation(); navigate(`/watch/${video.animeId}`); setShowMoreMenu(false); }}
 className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-white/90 hover:bg-neutral-800 transition-colors text-left"
 >
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
 <div className={`bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-center shadow-xl overflow-hidden cursor-pointer group ${className}`} onClick={e => { e.stopPropagation(); if (video.animeId) navigate(`/anime/${video.animeId}`); }}>
 <BoxyTV size={14} className="text-white/90 flex-shrink-0 mr-2 group-hover:text-white transition-colors z-10" />
 
 {isLong ? (
 <div className="relative w-[160px] overflow-hidden flex-shrink-0" style={{ WebkitMaskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
 <div 
 className="whitespace-nowrap text-[12px] font-bold text-white/90 group-hover:text-white transition-colors flex w-max"
 style={{ animation: `marquee ${Math.max(video.animeTitle.length * 0.2, 5)}s linear infinite` }}
 >
 <div className="flex items-center gap-4 pe-4">
 <span>{video.animeTitle}</span>
 <span className="text-white/90">•</span>
 </div>
 <div className="flex items-center gap-4 pe-4">
 <span>{video.animeTitle}</span>
 <span className="text-white/90">•</span>
 </div>
 </div>
 <style>{`
 @keyframes marquee {
 0% { transform: translateX(0); }
 100% { transform: translateX(-50%); }
 }
 `}</style>
 </div>
 ) : (
 <span className="whitespace-nowrap text-[12px] font-bold text-white/90 group-hover:text-white transition-colors">
 {video.animeTitle}
 </span>
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
 {/* Play/Pause */}
 <button
 onClick={e => { e.stopPropagation(); togglePlay(); showControlsTemporarily(); }}
 className="w-9 h-9 flex-shrink-0 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 shadow-xl"
 >
 {isPaused ? <BoxyPlay size={16} fill="currentColor" className="ml-0.5" /> : <BoxyPause size={16} fill="currentColor" />}
 </button>

 {/* Volume Pill */}
 <div 
 onClick={e => e.stopPropagation()} 
 className="flex items-center gap-3 flex-shrink-0 bg-black/50 backdrop-blur-md h-9 rounded-full px-3 shadow-xl overflow-hidden w-12 hover:w-32 transition-all duration-300 ease-out group"
 >
 <button onClick={() => { setIsMuted(m => !m); showControlsTemporarily(); }} className="text-white hover:text-white/90 transition-colors flex-shrink-0">
 {isMuted || volume === 0 ? <BoxyVolumeX size={16} /> : <BoxyVolume size={16} />}
 </button>
 <div className="relative h-1 bg-neutral-700 rounded-full flex items-center w-0 opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300">
 <div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
 <div className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none -ml-[6px]" style={{ left: `${(isMuted ? 0 : volume) * 100}%` }} />
 <input
 type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
 onChange={e => {
 const val = parseFloat(e.target.value);
 setVolume(val);
 setIsMuted(val === 0);
 showControlsTemporarily();
 }}
 className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10"
 />
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Title Pill */}
 <div className={`pointer-events-auto flex-shrink-0 transition-opacity duration-300 ease-out ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
 {renderTopCenterPill("max-w-[400px]")}
 </div>
 </div>
 );
 };

 return (
 <div className="relative h-[100dvh] w-full snap-start bg-black flex items-center justify-center overflow-hidden">

 {/* ══════════════════ DESKTOP LAYOUT ══════════════════ */}
 {isDesktop && (
 <>
 {/* Blurred background */}
 <div className="absolute inset-0 z-0">
 {isAdjacent ? (
 <video ref={bgVideoRef} preload="auto"
 poster={video.url?.replace('/video/upload/', '/video/upload/so_1,f_jpg/')}
 src={video.url} className="w-full h-full object-cover blur-[80px] opacity-25" muted loop playsInline />
 ) : <div className="w-full h-full bg-black" />}
 <div className="absolute inset-0 bg-black/55" />
 </div>

 {/* Desktop top-left nav */}
 <div className="absolute left-10 top-10 flex items-center gap-3 z-[60]">
 <button onClick={() => navigate('/')}
 className="w-12 h-11 flex items-center justify-center bg-white/8 backdrop-blur-md hover:bg-white/15 text-white/90 hover:text-white transition-all rounded-full">
 <BoxyHome size={20} />
 </button>
 <button onClick={onUploadClick}
 className="w-12 h-11 flex items-center justify-center bg-white/8 backdrop-blur-md hover:bg-white/15 text-white/90 hover:text-white transition-all rounded-full">
 <BoxyPlus size={20} />
 </button>
 </div>

 {/* Center: video + right actions */}
 <motion.div
 animate={{ x: showComments ? -180 : 0 }}
 transition={{ type: 'spring', damping: 30, stiffness: 300 }}
 className="absolute inset-0 z-10 flex items-center justify-center gap-5 px-10"
 >
 {/* 9:16 video player */}
 <div
 onClick={handleVideoTap}
 onMouseMove={showControlsTemporarily}
 className="relative h-[96vh] aspect-[9/16] bg-black shadow-2xl cursor-pointer overflow-hidden flex-shrink-0"
 >
 {isAdjacent ? (
 <video
 ref={desktopVideoRef} preload="auto"
 poster={video.url?.replace('/video/upload/', '/video/upload/so_1,f_jpg/')}
 src={video.url}
 className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none"
 loop muted={isMuted} playsInline
 disablePictureInPicture disableRemotePlayback
 onTimeUpdate={handleTimeUpdate}
 onLoadedMetadata={handleTimeUpdate}
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
 <BoxyPlay size={48} className="text-white/15" />
 </div>
 )}

 {/* Bottom gradient overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none z-10" />

 {/* Unified Desktop Top Controls */}
 {renderDesktopTopControls()}

 {/* Bottom metadata */}
 <div className={`absolute bottom-0 left-0 right-0 z-20 px-4 pt-4 pb-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
 {/* Author row */}
 <div className="flex items-center gap-2 mb-2">
 <img loading="lazy" src={displayAvatar} className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0" alt="" />
 <span className="text-white font-semibold text-[14px] tracking-tight">{displayName}</span>
 {user && video.userId !== user?.uid && (
 <>
 <span className="text-white/90 font-bold mx-1">•</span>
 <button
 onClick={e => { e.stopPropagation(); toggleFollow(video.userId); }}
 className={`text-[14px] font-bold transition-all ${isFollowing ? 'text-white/90' : 'text-white hover:text-white/90'}`}
 >
 {isFollowing ? 'Following' : 'Follow'}
 </button>
 </>
 )}
 </div>
 {/* Caption */}
 <p
 onClick={e => { e.stopPropagation(); setIsDescExpanded(p => !p); }}
 className={`text-[12px] text-white/90 font-medium leading-relaxed cursor-pointer tracking-tight ${isDescExpanded ? '' : 'line-clamp-2'}`}
 >
 {video.caption}
 </p>
 </div>

 {/* Seekbar (tap-to-show) */}
 <div className={`absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 transition-all duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
 <div className="flex items-center gap-2 mb-2">
 <span className="text-[11px] font-bold text-white drop-shadow-md">{formatTime(currentTime)}</span>
 <span className="text-[11px] font-bold text-white/90 drop-shadow-md">/ {formatTime(duration)}</span>
 </div>
 <div className="relative w-full h-1 bg-neutral-700 rounded-full flex items-center">
 <div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
 <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md pointer-events-none -ml-[7px]" style={{ left: `${progressPct}%` }} />
 <input
 type="range" min="0" max={duration || 100} step="0.01" value={currentTime}
 onChange={handleSliderChange} onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)}
 onTouchStart={() => setIsDragging(true)} onTouchEnd={() => setIsDragging(false)}
 className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10"
 />
 </div>
 </div>

 {/* Center Play/Pause button for desktop */}
 <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
 <button onClick={(e) => { e.stopPropagation(); handlePlayPause(e); }} className="pointer-events-auto w-[68px] h-[68px] rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform shadow-2xl">
 {isPaused ? <BoxyPlay size={30} fill="currentColor" className="ml-1" /> : <BoxyPause size={30} fill="currentColor" />}
 </button>
 </div>
 </div>

 {/* Right action column */}
 <div className={`flex flex-col items-center justify-end h-[96vh] pb-10 transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
 {renderActionColumn(true)}
 </div>
 </motion.div>

 {/* Comments drawer */}
 <AnimatePresence>
 {showComments && (
 <>
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={() => setShowComments(false)}
 className="fixed inset-0 bg-black/40 z-[150] backdrop-blur-sm" />
 <CommentsDrawer reelId={video.id} reelAuthorId={video.userId} onClose={() => setShowComments(false)} onUpdateCount={setCommentsCount} />
 </>
 )}
 </AnimatePresence>
 </>
 )}

 {/* ══════════════════ MOBILE LAYOUT ══════════════════ */}
 {!isDesktop && (
 <div className="relative h-full w-full" onClick={handleVideoTap}>
 {/* Full-screen video */}
 {isAdjacent ? (
 <video
 ref={mobileVideoRef} preload="auto"
 poster={video.url?.replace('/video/upload/', '/video/upload/so_1,f_jpg/')}
 src={video.url}
 className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none"
 loop muted={isMuted} playsInline
 disablePictureInPicture disableRemotePlayback
 onTimeUpdate={handleTimeUpdate}
 onLoadedMetadata={handleTimeUpdate}
 />
 ) : (
 <div className="absolute inset-0 bg-black z-0 flex items-center justify-center">
 <BoxyPlay size={48} className="text-white/90" />
 </div>
 )}

 {/* Gradient overlays */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />

 {/* ── TOP NAV HEADER ── */}
 <div className={`absolute top-0 left-0 right-0 z-40 h-[90px] px-4 pt-10 pb-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-center transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none'}`}>
 {/* Left: Back */}
 <div className="absolute left-4 pointer-events-auto">
 <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-white drop-shadow-md">
 <BoxyChevron direction="left" size={28} />
 </button>
 </div>

 {/* Center: Title Pill */}
 <div className="pointer-events-auto w-full max-w-[200px] flex justify-center">
 {renderTopCenterPill("w-full")}
 </div>

 {/* Right: Upload */}
 <div className="absolute right-4 pointer-events-auto">
 <button onClick={e => { e.stopPropagation(); onUploadClick(); }} className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-colors">
 <BoxyPlus size={24} />
 </button>
 </div>
 </div>

 {/* ── CENTER PLAYBACK CONTROLS (tap-to-show, auto-hide 3s) ── */}
 <AnimatePresence>
 {showControls && (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 transition={{ duration: 0.15 }}
 className="absolute inset-0 z-30 flex items-center justify-center gap-8 pointer-events-none"
 >
 <button onClick={e => seekBy(-5, e)} className="pointer-events-auto w-14 h-14 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg">
 <span className="text-[11px] font-bold tracking-tight">−5</span>
 </button>
 <button onClick={handlePlayPause} className="pointer-events-auto w-[68px] h-[68px] rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform shadow-2xl">
 {isPaused ? <BoxyPlay size={30} fill="currentColor" className="ml-1" /> : <BoxyPause size={30} fill="currentColor" />}
 </button>
 <button onClick={e => seekBy(5, e)} className="pointer-events-auto w-14 h-14 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg">
 <span className="text-[11px] font-bold tracking-tight">+5</span>
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ── RIGHT ACTION COLUMN ── */}
 <div className={`absolute right-3 z-30 flex flex-col items-center gap-5 transition-all duration-300 ease-out bottom-[80px] ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-x-4'}`}
 onClick={e => e.stopPropagation()}>
 {renderActionColumn(false)}
 </div>

 {/* ── BOTTOM METADATA ── */}
 <div className={`absolute left-0 right-[72px] z-30 px-4 transition-all duration-300 ease-out bottom-[55px] ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-4'}`}
 onClick={e => e.stopPropagation()}>
 {/* Author row */}
 <div className="flex items-center gap-2 mb-1.5 flex-wrap">
 <img loading="lazy" src={displayAvatar} className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0" alt="" />
 <span className="text-white font-bold text-[14px] tracking-tight">{displayName}</span>
 {user && video.userId !== user?.uid && (
 <>
 <span className="text-white/90 font-bold mx-0.5">•</span>
 <button
 onClick={() => toggleFollow(video.userId)}
 className={`text-[14px] font-bold transition-all ${isFollowing ? 'text-white/90' : 'text-white hover:text-white/90'}`}
 >
 {isFollowing ? 'Following' : 'Follow'}
 </button>
 </>
 )}
 </div>
 {/* Caption */}
 <p
 onClick={() => setIsDescExpanded(p => !p)}
 className={`text-[13px] text-white/90 font-medium leading-relaxed tracking-tight cursor-pointer ${isDescExpanded ? '' : 'line-clamp-2'}`}
 >
 {video.caption}
 </p>
 </div>

 {/* ── BOTTOM CONTROLS & SEEKBAR ── */}
 <div className={`absolute bottom-0 left-0 right-0 z-40 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} onClick={e => e.stopPropagation()}>
 <div className="px-4 mb-4 flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 {/* Play/Pause */}
 <button onClick={handlePlayPause} className="text-white drop-shadow-md active:scale-90 transition-transform">
 {isPaused ? <BoxyPlay size={20} fill="currentColor" /> : <BoxyPause size={20} fill="currentColor" />}
 </button>
 
 {/* Mobile Volume Slider */}
 <div className="flex items-center gap-2 group">
 <button onClick={() => { setIsMuted(m => !m); showControlsTemporarily(); }} className="text-white drop-shadow-md">
 {isMuted || volume === 0 ? <BoxyVolumeX size={18} /> : <BoxyVolume size={18} />}
 </button>
 <div className="relative w-16 h-1 bg-neutral-700 rounded-full flex items-center drop-shadow-md">
 <div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
 <div className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-md pointer-events-none -ml-[5px]" style={{ left: `${(isMuted ? 0 : volume) * 100}%` }} />
 <input
 type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
 onChange={e => {
 const val = parseFloat(e.target.value);
 setVolume(val);
 setIsMuted(val === 0);
 showControlsTemporarily();
 }}
 className="absolute inset-0 w-full h-8 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10"
 />
 </div>
 </div>
 </div>
 <span className="text-[12px] font-bold text-white drop-shadow-md">{formatTime(currentTime)} <span className="text-white/90">/ {formatTime(duration)}</span></span>
 </div>
 </div>

 {/* Seekbar */}
 <div className="px-4 mb-4 transition-all duration-300">
 <div className="relative w-full h-1.5 bg-neutral-700 rounded-full flex items-center transition-all duration-300">
 <div className="absolute left-0 h-full bg-white rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
 <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md pointer-events-none -ml-[7px]" style={{ left: `${progressPct}%` }} />
 <input
 type="range" min="0" max={duration || 100} step="0.01" value={currentTime}
 onChange={handleSliderChange} onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)}
 onTouchStart={() => setIsDragging(true)} onTouchEnd={() => setIsDragging(false)}
 className="absolute inset-0 w-full h-10 -translate-y-1/2 top-1/2 opacity-0 cursor-pointer z-10"
 />
 </div>
 </div>
 </div>

 {/* Comments drawer */}
 <AnimatePresence>
 {showComments && (
 <>
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={() => setShowComments(false)}
 className="fixed inset-0 bg-black/50 z-[180] backdrop-blur-sm" />
 <CommentsDrawer reelId={video.id} reelAuthorId={video.userId} onClose={() => setShowComments(false)} onUpdateCount={setCommentsCount} />
 </>
 )}
 </AnimatePresence>
 </div>
 )}
 </div>
 );
});

/* ─────────────────────────────────────────────
 REEL PAGE — main container
───────────────────────────────────────────── */
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
 <div className="fixed inset-0 bg-black z-0">
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
 <div className="h-[100dvh] w-full flex flex-col items-center justify-center text-white/90 gap-6 px-6 text-center">
 <div className="w-20 h-20 bg-neutral-900 flex items-center justify-center">
 <BoxyReels size={40} className="opacity-20 text-white" />
 </div>
 <div className="space-y-2">
 <p className="font-semibold text-micro text-white tracking-tight">No reels yet</p>
 <p className="font-medium text-micro opacity-60 tracking-tight">Be the first to start the trend!</p>
 </div>
 <button onClick={() => setShowUpload(true)}
 className="bg-white text-background px-10 py-4 font-bold text-micro hover:bg-white/90 transition-all shadow-xl tracking-tight">
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
