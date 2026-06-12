import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoxyBell, BoxyX, BoxyMoreVertical, BoxyPlay, BoxyMessage, BoxyStar } from '../ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationService } from '../../services/NotificationService';

const NotificationHub = ({ isOpen, onToggle }) => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const { notifications, unreadCount } = useNotifications(user);
 const [filter, setFilter] = useState('all');
 const [showOptions, setShowOptions] = useState(false);

 const handleMarkAllRead = async () => {
 if (unreadCount === 0) return;
 await NotificationService.markAllAsRead(notifications, user?.uid);
 setShowOptions(false);
 };

 const handleClearAll = async () => {
 if (!window.confirm("Are you sure you want to clear all notifications?")) return;
 await NotificationService.clearAllNotifications(notifications, user?.uid);
 setShowOptions(false);
 };

 const handleNotificationClick = async (notif) => {
 await NotificationService.markAsRead(notif.id, notif.readBy, user?.uid);
 if (notif.targetPath) {
 const safeTargetId = notif.targetId && notif.targetId !== 'undefined' ? notif.targetId : null;
 const fullPath = safeTargetId
 ? `${notif.targetPath}/${safeTargetId}`
 : notif.targetPath;
 navigate(fullPath);
 onToggle(false);
 }
 };

 const displayedNotifications = filter === 'unread' 
 ? notifications.filter(n => !n.readBy?.includes(user?.uid)) 
 : notifications;

 // Group notifications a la Facebook
 const groupNotifications = (notifs) => {
 const groups = { New: [], Today: [], Earlier: [] };
 const now = new Date();
 
 notifs.forEach(notif => {
 if (!notif.createdAt) {
 groups.New.push(notif);
 return;
 }
 const date = notif.createdAt.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt);
 const diffHours = (now - date) / (1000 * 60 * 60);
 const diffDays = (now - date) / (1000 * 60 * 60 * 24);
 
 if (diffHours < 4) {
 groups.New.push(notif);
 } else if (diffDays < 1) {
 groups.Today.push(notif);
 } else {
 groups.Earlier.push(notif);
 }
 });
 
 return groups;
 };

 const grouped = groupNotifications(displayedNotifications);

 const getTypeIcon = (message) => {
 if (message.toLowerCase().includes('episode') || message.toLowerCase().includes('reel')) {
 return <BoxyPlay size={10} className="text-white" fill="currentColor" />;
 }
 if (message.toLowerCase().includes('comment') || message.toLowerCase().includes('mention')) {
 return <BoxyMessage size={10} className="text-white" fill="currentColor" />;
 }
 return <BoxyStar size={10} className="text-white" fill="currentColor" />;
 };

 const renderGroup = (title, notifs) => {
 if (notifs.length === 0) return null;
 return (
 <div className="mb-2">
 <h4 className="text-body font-medium text-white px-4 mb-2">{title}</h4>
 {notifs.map((notif) => {
 const isUnread = !notif.readBy?.includes(user?.uid);
 const cleanMessage = notif.message.replace(/^System\s*/i, '');
 
 return (
 <div
 key={notif.id}
 className="p-3 px-4 flex gap-4 hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 transition-colors cursor-pointer group relative"
 onClick={() => handleNotificationClick(notif)}
 >
 <div className="relative">
 <div className="w-14 h-14 bg-transparent flex-shrink-0 flex items-center justify-center">
 <img loading="lazy"
 src={notif.actorAvatar ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg"}
 className="w-full h-full object-cover"
 alt="Avatar"
 />
 </div>
 {/* Type Badge - Kept boxy to match identity */}
 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-2 border-background flex items-center justify-center shadow-lg">
 {getTypeIcon(notif.message)}
 </div>
 </div>
 
 <div className="flex-grow pr-6 flex flex-col justify-center min-h-[56px] space-y-0.5">
 <p className="text-body text-white leading-tight">
 {notif.actorName && <span className="font-medium text-white mr-1">{notif.actorName}</span>}
 {cleanMessage}
 </p>
 <p className="text-micro font-medium text-primary">
 {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
 </p>
 </div>

 {/* Facebook-style unread dot (kept square for boxy theme) */}
 {isUnread && (
 <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary shadow-[0_0_8px_rgba(133,232,92,0.5)]" />
 )}
 </div>
 );
 })}
 </div>
 );
 };

 return (
 <div className="static md:relative z-[100]">
 <button
 onClick={() => {
 onToggle(!isOpen);
 }}
 className="relative p-2 hover:text-white transition-colors"
 >
 <BoxyBell size={22} fill={unreadCount > 0 ?"currentColor" :"none"} />
 {unreadCount > 0 && (
 <span className="absolute top-1 right-1 w-4 h-4 bg-white text-black text-[10px] font-medium flex items-center justify-center rounded-xl border-2 border-background shadow-[0_0_10px_rgba(255,255,255,0.3)]">
 {unreadCount}
 </span>
 )}
 </button>

 <AnimatePresence>
 {isOpen && (
 <>
 <div
 className="fixed inset-0 bg-black/20 md:bg-transparent"
 onClick={() => { onToggle(false); setShowOptions(false); }}
 />
 <motion.div
 initial={{ opacity: 0, y: -10, scale: 0.98 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -10, scale: 0.98 }}
 transition={{ duration: 0.2 }}
 className="absolute top-full left-0 md:left-auto md:right-0 md:mt-4 w-full md:w-[420px] bg-background md:bg-neutral-900/95 md:backdrop-blur-3xl md: shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh]"
 >
 <div className="p-4 flex flex-col gap-4 flex-shrink-0">
 <div className="flex justify-between items-center relative">
 <h3 className="text-[24px] font-medium text-white leading-none">Notifications</h3>
 
 <button 
 onClick={() => setShowOptions(!showOptions)}
 className="p-1.5 hover:bg-white/10 backdrop-blur-md rounded-xl transition-colors text-white"
 >
 <BoxyMoreVertical size={20} />
 </button>

 {/* Options Dropdown */}
 <AnimatePresence>
 {showOptions && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="absolute top-full right-0 mt-2 w-48 bg-[#1A1A1A] shadow-xl z-50 py-1"
 >
 <button onClick={handleMarkAllRead} className="w-full px-4 py-2.5 text-left text-body text-white hover:bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2">
 <BoxyBell size={16} /> Mark all as read
 </button>
 <button onClick={handleClearAll} className="w-full px-4 py-2.5 text-left text-body text-white hover:bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2">
 <BoxyX size={16} /> Clear notifications
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 
 <div className="flex gap-2">
 <button 
 onClick={() => setFilter('all')} 
 className={`px-4 py-1.5 text-body font-medium transition-colors ${filter === 'all' ? 'bg-white/10 backdrop-blur-md rounded-xl text-white' : 'text-white hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:text-white'}`}
 >
 All
 </button>
 <button 
 onClick={() => setFilter('unread')} 
 className={`px-4 py-1.5 text-body font-medium transition-colors ${filter === 'unread' ? 'bg-white/10 backdrop-blur-md rounded-xl text-white' : 'text-white hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:text-white'}`}
 >
 Unread
 </button>
 </div>
 </div>

 <div className="flex-grow overflow-y-auto no-scrollbar overscroll-contain pb-4">
 {displayedNotifications.length > 0 ? (
 <>
 {renderGroup('New', grouped.New)}
 {renderGroup('Today', grouped.Today)}
 {renderGroup('Earlier', grouped.Earlier)}
 </>
 ) : (
 <div className="py-20 flex flex-col items-center justify-center text-white gap-4">
 <BoxyBell size={48} className="opacity-20" />
 <p className="text-body font-medium text-white">No notifications</p>
 </div>
 )}
 </div>

 <div className="">
 <button
 onClick={() => {
 navigate('/notifications');
 onToggle(false);
 }}
 className="w-full py-3.5 text-body font-medium text-primary hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 transition-all"
 >
 See all
 </button>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 );
};

export default NotificationHub;
