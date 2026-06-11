import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BoxyX, BoxyHeart, BoxyMessage } from '../ui/BoxyIcons';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, increment, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

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
      className="fixed inset-x-0 bottom-0 h-[78vh] lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:h-full bg-black/70 backdrop-blur-3xl lg:border-t-0 z-[200] flex flex-col shadow-2xl"
    >
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
        <h3 className="font-semibold text-white text-[15px]">{comments.length} Comments</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-md rounded-xl rounded-full transition-all">
          <BoxyX size={18} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
        {loading ? (
          <div className="space-y-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/8 flex-shrink-0" />
                <div className="flex-grow space-y-2">
                  <div className="h-3 w-20 bg-white/10 backdrop-blur-md rounded-xl rounded" />
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
                    {c.userId === reelAuthorId && <span className="text-[9px] font-bold bg-white/10 backdrop-blur-md rounded-xl text-white/90 px-1.5 py-0.5 rounded-full">OP</span>}
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

      {replyingTo && (
        <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-medium text-white/90">Replying to <span className="text-white/90 font-semibold">@{replyingTo.userName}</span></span>
          <button onClick={() => setReplyingTo(null)} className="text-white/90 hover:text-white transition-colors">
            <BoxyX size={14} />
          </button>
        </div>
      )}

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
              className="flex-shrink-0 text-[12px] font-bold text-white disabled:opacity-25 hover:text-white/90 transition-colors rounded-xl">
              Post
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default CommentsDrawer;
