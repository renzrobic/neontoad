import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BoxyBell, BoxyX, BoxyMoreVertical, BoxyPlay, BoxyMessage, BoxyStar } from '../components/ui/BoxyIcons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationService } from '../services/NotificationService';
import PageLoader from '../components/ui/PageLoader';

const NotificationsPage = () => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const { notifications, unreadCount } = useNotifications(user);
 const [filter, setFilter] = useState('all');
 const [showOptions, setShowOptions] = useState(false);

 if (!user) return <PageLoader />;

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
 }
 };

 const displayedNotifications = filter === 'unread' 
 ? notifications.filter(n => !n.readBy?.includes(user?.uid)) 
 : notifications;

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
 return <BoxyPlay size={12} className="text-white" fill="currentColor" />;
 }
 if (message.toLowerCase().includes('comment') || message.toLowerCase().includes('mention')) {
 return <BoxyMessage size={12} className="text-white" fill="currentColor" />;
 }
 return <BoxyStar size={12} className="text-white" fill="currentColor" />;
 };

 const renderGroup = (title, notifs) => {
 if (notifs.length === 0) return null;
 return (
 <div className="mb-6">
 <h4 className="text-h4 font-bold text-white mb-4 tracking-tight px-2">{title}</h4>
 <div className="space-y-1">
 {notifs.map((notif) => {
 const isUnread = !notif.readBy?.includes(user?.uid);
 const cleanMessage = notif.message.replace(/^System\s*/i, '');
 
 return (
 <div
 key={notif.id}
 onClick={() => handleNotificationClick(notif)}
 className="group relative flex items-start gap-4 md:gap-5 p-4 md:p-5 hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 transition-all cursor-pointer"
 >
 <div className="relative">
 <div className="w-16 h-16 flex-shrink-0 bg-transparent overflow-hidden">
 <img 
 loading="lazy"
 src={notif.actorAvatar ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg"}
 className="w-full h-full object-cover"
 alt=""
 />
 </div>
 <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary border-2 border-background flex items-center justify-center shadow-lg">
 {getTypeIcon(notif.message)}
 </div>
 </div>
 
 <div className="flex-grow pr-10 flex flex-col justify-center min-h-[64px] space-y-1">
 <p className="text-body md:text-h4 text-white/90 leading-tight">
 {notif.actorName && <span className="font-bold text-white mr-1.5">{notif.actorName}</span>}
 {cleanMessage}
 </p>
 <p className="text-micro md:text-body font-bold text-primary tracking-tight">
 {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
 </p>
 </div>
 
 {isUnread && (
 <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary shadow-[0_0_12px_rgba(133,232,92,0.6)]" />
 )}
 </div>
 );
 })}
 </div>
 </div>
 );
 };

 return (
 <div className="pt-24 md:pt-32 pb-20 min-h-screen bg-transparent px-6 md:px-16 max-w-4xl mx-auto">
 <div className="flex justify-between items-center mb-8 relative">
 <h1 className="text-[40px] md:text-[48px] font-bold text-white leading-none tracking-tighter">Notifications</h1>
 
 <button 
 onClick={() => setShowOptions(!showOptions)}
 className="p-2 md:p-3 hover:bg-white/10 backdrop-blur-md rounded-xl transition-colors text-white/90"
 >
 <BoxyMoreVertical size={28} />
 </button>

 <AnimatePresence>
 {showOptions && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="absolute top-full right-0 mt-2 w-64 bg-[#1A1A1A] shadow-2xl z-50 py-2"
 >
 <button onClick={handleMarkAllRead} className="w-full px-5 py-3 text-left text-body text-white hover:bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-3">
 <BoxyBell size={20} /> Mark all as read
 </button>
 <button onClick={handleClearAll} className="w-full px-5 py-3 text-left text-body text-white hover:bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-3">
 <BoxyX size={20} /> Clear notifications
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <div className="flex gap-3 mb-10">
 <button 
 onClick={() => setFilter('all')} 
 className={`px-5 py-2 text-body font-bold transition-colors ${filter === 'all' ? 'bg-white/10 backdrop-blur-md rounded-xl text-white' : 'text-white/90 hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:text-white'}`}
 >
 All
 </button>
 <button 
 onClick={() => setFilter('unread')} 
 className={`px-5 py-2 text-body font-bold transition-colors ${filter === 'unread' ? 'bg-white/10 backdrop-blur-md rounded-xl text-white' : 'text-white/90 hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:text-white'}`}
 >
 Unread
 </button>
 </div>

 <div>
 {displayedNotifications.length > 0 ? (
 <>
 {renderGroup('New', grouped.New)}
 {renderGroup('Today', grouped.Today)}
 {renderGroup('Earlier', grouped.Earlier)}
 </>
 ) : (
 <div className="flex flex-col items-center justify-center py-32">
 <BoxyBell size={56} className="text-white/90 mb-6" />
 <p className="text-h4 text-white/90 font-bold">No notifications to show</p>
 </div>
 )}
 </div>
 </div>
 );
};

export default NotificationsPage;
