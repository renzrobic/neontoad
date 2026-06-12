import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, orderBy, limit, onSnapshot, serverTimestamp, where, getDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import {
 BoxyPlus, BoxyX, BoxyCheck, BoxyAlert, BoxyTV, BoxySearch,
 BoxyUser, BoxyShield, BoxyLogOut, BoxyMenu, BoxyChevron, BoxyPlay
} from '../components/ui/BoxyIcons';
import AdminAvatars from '../components/AdminAvatars';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

import logoFull from '../assets/logo/logo-full.svg';

const BRAND_GREEN ="#86E95C";

const Admin = () => {
 const { user } = useAuth();
 const [isAuthorized, setIsAuthorized] = useState(false);
 const [checkingAuth, setCheckingAuth] = useState(true);
 const [passcode, setPasscode] = useState('');
 const [activeTab, setActiveTab] = useState('overview');
 const [anime, setAnime] = useState([]);
 const [animeSearchQuery, setAnimeSearchQuery] = useState('');
 const [schedules, setSchedules] = useState([]);
 const [newsList, setNewsList] = useState([]);
 const [reelsList, setReelsList] = useState([]);
 const [queuedEpisodes, setQueuedEpisodes] = useState([]);
 const [featuredList, setFeaturedList] = useState([]);
 const [usersList, setUsersList] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [deleteModal, setDeleteModal] = useState({ isOpen: false, collection: '', id: '', title: '', input: '' });
 const [editingItem, setEditingItem] = useState(null);
 const [selectedAnimeForEpisodes, setSelectedAnimeForEpisodes] = useState(null);
 const [selectedReelForModeration, setSelectedReelForModeration] = useState(null);
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [uploading, setUploading] = useState(false);
 const editorRef = useRef(null);
 const fileInputRef = useRef(null);

 // Ad State
 const [ad1Data, setAd1Data] = useState(null);
 const [ad2Data, setAd2Data] = useState(null);

 // Stats
 const [stats, setStats] = useState({
 totalAnime: 0, totalSchedules: 0, totalNews: 0, totalReels: 0,
 totalUsers: 0, dau: 0, mau: 0, totalViews: 0
 });

 // Form States
 const [formData, setFormData] = useState({
 title: '', rating: '', description: '', genres: '', image: '', episodes: '', seasons: '',
 status: 'Finished Airing', type: 'TV Series', studio: '', bannerImage: '', bannerVideo: '', titleLogo: ''
 });
 const [newsFormData, setNewsFormData] = useState({
 title: '', category: 'Latest News', image: '', date: new Date().toLocaleDateString(), content: '', status: 'Published'
 });
 const [scheduleFormData, setScheduleFormData] = useState({
 dayOfWeek: 'Monday', time: '12:00', animeId: '', animeTitle: ''
 });
 const [featuredFormData, setFeaturedFormData] = useState({
 animeId: '', animeTitle: '', customImage: '', customVideo: '', tagline: '', customTitleLogo: ''
 });
 const [settingsFormData, setSettingsFormData] = useState({
 maintenanceMode: false,
 themeColor: '#86E95C',
 seoTitle: 'NeonToad - Anime Streaming',
 seoDescription: 'Stream your favorite anime.'
 });
 const [releaseEpisodeModal, setReleaseEpisodeModal] = useState({ isOpen: false, episode: null, date: '', time: '' });
 const [activeStyles, setActiveStyles] = useState({
 bold: false, italic: false, underline: false, 
 justifyLeft: false, justifyCenter: false, justifyRight: false,
 insertUnorderedList: false, insertOrderedList: false
 });

 useEffect(() => {
 const checkAdmin = async () => {
 if (!user) {
 setIsAuthorized(false);
 setCheckingAuth(false);
 return;
 }
 try {
 const adminDoc = await getDoc(doc(db, 'admins', user.uid));
 if (adminDoc.exists()) {
 setIsAuthorized(true);
 } else {
 setIsAuthorized(false);
 }
 } catch (e) {
 setIsAuthorized(false);
 }
 setCheckingAuth(false);
 };
 checkAdmin();
 }, [user]);

 const handleAuthorize = (e) => {
 e.preventDefault();
 toast.error("Passcode login is disabled. Please log in with an Admin account.");
 };

 const handleSaveSchedule = async (e) => {
 e.preventDefault();
 if (!scheduleFormData.date || !scheduleFormData.time || !scheduleFormData.animeTitle) {
 toast.error("Date, Time, and Anime Title Required");
 return;
 }
 setUploading(true);
 try {
 if (editingItem) {
 await updateDoc(doc(db, 'schedules', editingItem.id), scheduleFormData);
 toast.success("Release Updated");
 } else {
 const id = Date.now().toString();
 await setDoc(doc(db, 'schedules', id), { ...scheduleFormData, id });
 toast.success("Release Scheduled");
 }
 setShowModal(false);
 fetchData();
 } catch (err) {
 toast.error("Failed to save schedule");
 } finally {
 setUploading(false);
 }
 };

 const handleReleaseQueuedEpisode = async (e) => {
 e.preventDefault();
 if (!releaseEpisodeModal.date || !releaseEpisodeModal.time) return;
 
 setUploading(true);
 try {
 const releaseDateObj = new Date(`${releaseEpisodeModal.date}T${releaseEpisodeModal.time}`);
 await updateDoc(doc(db, 'episodes', releaseEpisodeModal.episode.id), {
 releaseDate: releaseDateObj,
 status: 'queued' // Explicitly keep it queued, but now it has a releaseDate
 });
 toast.success("Episode Release Scheduled!");
 setReleaseEpisodeModal({ isOpen: false, episode: null, date: '', time: '' });
 fetchData();
 } catch (err) {
 toast.error("Failed to schedule release");
 } finally {
 setUploading(false);
 }
 };

 const handleSaveFeatured = async (e) => {
 e.preventDefault();
 if (!featuredFormData.animeTitle) return;
 setUploading(true);
 try {
 if (editingItem) {
 await updateDoc(doc(db, 'featured', editingItem.id), featuredFormData);
 toast.success("Featured Item Updated");
 } else {
 const id = Date.now().toString();
 await setDoc(doc(db, 'featured', id), { ...featuredFormData, id });
 
 // Broadcast Notification
 await setDoc(doc(collection(db, 'notifications')), {
 recipientId: 'all',
 actorName: 'System',
 message: `New Featured Campaign: ${featuredFormData.animeTitle}`,
 actorAvatar: featuredFormData.customImage ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg",
 createdAt: serverTimestamp(),
 targetPath: '/',
 targetId: '',
 readBy: []
 });

 toast.success("Featured Item Added");
 }
 setShowModal(false);
 fetchData();
 } catch (err) {
 toast.error("Failed to save featured item");
 } finally {
 setUploading(false);
 }
 };

 const handlePromoteUser = async (userId, userEmail) => {
 if (window.confirm(`Promote ${userEmail} to Admin?`)) {
 try {
 await setDoc(doc(db, 'admins', userId), {
 email: userEmail,
 promotedAt: serverTimestamp()
 });
 toast.success(`${userEmail} promoted to Admin`);
 } catch (err) {
 toast.error("Failed to promote user");
 }
 }
 };

 const handleBanUser = async (userId, userEmail, isBanned) => {
 if (window.confirm(`${isBanned ? 'Unban' : 'Ban'} ${userEmail}?`)) {
 try {
 await updateDoc(doc(db, 'users', userId), {
 isBanned: !isBanned
 });
 toast.success(`User ${userEmail} has been ${isBanned ? 'unbanned' : 'banned'}`);
 fetchData();
 } catch (err) {
 toast.error("Failed to ban/unban user");
 }
 }
 };

 const fetchData = async (showLoader = false) => {
 if (showLoader) setLoading(true);
 let aData = [], sData = [], nData = [], rData = [], fData = [], uData = [];
 
 try {
 const aq = query(collection(db, 'anime'), orderBy('title'), limit(2000));
 const aSnap = await getDocs(aq);
 aData = aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setAnime(aData);
 } catch (err) { console.error("Anime fetch error:", err); }

 try {
 const sq = query(collection(db, 'schedules'));
 const sSnap = await getDocs(sq);
 sData = sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setSchedules(sData);
 } catch (err) { console.error("Schedules fetch error:", err); }

 try {
 const nq = query(collection(db, 'news'), orderBy('date', 'desc'));
 const nSnap = await getDocs(nq);
 nData = nSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setNewsList(nData);
 } catch (err) { console.error("News fetch error:", err); }

 try {
 const qeQ = query(collection(db, 'episodes'), where('status', '==', 'queued'));
 const qeSnap = await getDocs(qeQ);
 let qeData = qeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 
 const now = new Date();
 let autoPublishedCount = 0;

 // We also need the anime title and image for these episodes
 for (let qe of qeData) {
 const aDoc = await getDoc(doc(db, 'anime', String(qe.animeId)));
 if (aDoc.exists()) {
 qe.animeTitle = aDoc.data().title;
 qe.animeImage = aDoc.data().image;
 }

 // Auto-Publish if release date has passed
 if (qe.releaseDate && qe.releaseDate.toDate() <= now) {
 try {
 await updateDoc(doc(db, 'episodes', qe.id), {
 status: 'published',
 createdAt: serverTimestamp()
 });
 await setDoc(doc(collection(db, 'notifications')), {
 recipientId: 'all',
 actorName: 'System',
 message: `New Episode Released: ${qe.animeTitle || 'Anime'} - Episode ${qe.episodeNumber || 1}`,
 actorAvatar: qe.animeImage ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg",
 createdAt: serverTimestamp(),
 targetPath: '/watch',
 targetId: qe.id,
 readBy: []
 });
 autoPublishedCount++;
 } catch(e) { console.error("Auto-publish failed", e); }
 }
 }

 if (autoPublishedCount > 0) {
 toast.success(`${autoPublishedCount} queued episode(s) automatically published!`);
 qeData = qeData.filter(ep => !(ep.releaseDate && ep.releaseDate.toDate() <= now));
 }

 setQueuedEpisodes(qeData);
 } catch (err) { console.error("Queued Episodes fetch error:", err); }

 try {
 const rq = query(collection(db, 'reels'), orderBy('createdAt', 'desc'));
 const rSnap = await getDocs(rq);
 rData = rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 
 // Sort by reportCount descending
 rData.sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0));
 
 // Fetch latest comments for each reel
 for (let r of rData) {
 try {
 const cq = query(collection(db, 'reels', r.id, 'comments'), orderBy('createdAt', 'desc'), limit(2));
 const cSnap = await getDocs(cq);
 r.recentComments = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
 } catch(err) {}
 }
 
 setReelsList(rData);
 } catch (err) { console.error("Reels fetch error:", err); }

 try {
 const fq = query(collection(db, 'featured'));
 const fSnap = await getDocs(fq);
 fData = fSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setFeaturedList(fData);
 } catch (err) { console.error("Featured fetch error:", err); }

 try {
 const uq = query(collection(db, 'users'));
 const uSnap = await getDocs(uq);
 uData = uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setUsersList(uData);
 } catch (err) { console.error("Users fetch error:", err); }

 // Calculate Analytics
 let dauCount = 0;
 let mauCount = 0;
 const now = Date.now();
 const oneDay = 24 * 60 * 60 * 1000;
 const thirtyDays = 30 * oneDay;

 uData.forEach(user => {
 let latestActivity = user.createdAt ? new Date(user.createdAt).getTime() : 0;
 if (user.profiles) {
 user.profiles.forEach(profile => {
 if (profile.watchHistory) {
 profile.watchHistory.forEach(history => {
 if (history.updatedAt > latestActivity) {
 latestActivity = history.updatedAt;
 }
 });
 }
 });
 }
 if (now - latestActivity < oneDay) dauCount++;
 if (now - latestActivity < thirtyDays) mauCount++;
 });

 const totalViews = aData.reduce((sum, item) => sum + (item.viewCount || 0), 0);

 setStats({
 totalAnime: aData.length, 
 totalSchedules: sData.length,
 totalNews: nData.length, 
 totalReels: rData.length,
 totalUsers: uData.length,
 dau: dauCount,
 mau: mauCount,
 totalViews: totalViews
 });
 
 if (showLoader) setLoading(false);
 };

 useEffect(() => {
 if (!isAuthorized) return;
 fetchData(true);
 const unsub1 = onSnapshot(doc(db, 'siteConfig', 'ad1'), (doc) => { if (doc.exists()) setAd1Data(doc.data()); });
 const unsub2 = onSnapshot(doc(db, 'siteConfig', 'ad2'), (doc) => { if (doc.exists()) setAd2Data(doc.data()); });
 const unsub3 = onSnapshot(doc(db, 'siteConfig', 'global'), (doc) => { if (doc.exists()) setSettingsFormData(doc.data()); });
 return () => { unsub1(); unsub2(); unsub3(); };
 }, [isAuthorized]);

 const handleSaveSettings = async (e) => {
 e.preventDefault();
 try {
 await setDoc(doc(db, 'siteConfig', 'global'), settingsFormData);
 toast.success("Site Settings Updated");
 } catch (err) {
 toast.error("Failed to update site settings");
 }
 };

 const execCommand = (command, value = null) => {
 document.execCommand(command, false, value);
 if (editorRef.current) {
 setNewsFormData(prev => ({ ...prev, content: editorRef.current.innerHTML }));
 }
 };

 const updateActiveStyles = () => {
 setActiveStyles({
 bold: document.queryCommandState('bold'),
 italic: document.queryCommandState('italic'),
 underline: document.queryCommandState('underline'),
 justifyLeft: document.queryCommandState('justifyLeft'),
 justifyCenter: document.queryCommandState('justifyCenter'),
 justifyRight: document.queryCommandState('justifyRight'),
 insertUnorderedList: document.queryCommandState('insertUnorderedList'),
 insertOrderedList: document.queryCommandState('insertOrderedList'),
 blockquote: document.queryCommandValue('formatBlock') === 'blockquote' || document.queryCommandState('formatBlock')
 });
 };

 useEffect(() => {
 const handleSelection = () => {
 if (showModal && activeTab === 'news') {
 updateActiveStyles();
 }
 };
 document.addEventListener('selectionchange', handleSelection);
 return () => document.removeEventListener('selectionchange', handleSelection);
 }, [showModal, activeTab]);

 useEffect(() => {
 if (showModal && activeTab === 'news' && editorRef.current) {
 editorRef.current.innerHTML = newsFormData.content || '';
 }
 }, [showModal, activeTab]);

 const handleFileUpload = async (e, type = 'content') => {
 const file = e.target.files[0];
 if (!file) return;

 // --- CLOUDINARY CONFIGURATION ---
 const CLOUD_NAME ="diyghrhlk"; 
 const UPLOAD_PRESET ="my_reels_video_preset"; 
 // --------------------------------

 setUploading(true);
 try {
 const formData = new FormData();
 formData.append("file", file);
 formData.append("upload_preset", UPLOAD_PRESET);

 const response = await fetch(
 `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
 { method:"POST", body: formData }
 );
 
 const data = await response.json();
 const url = data.secure_url;

 if (type === 'featured') { 
 setNewsFormData(prev => ({ ...prev, image: url })); 
 toast.success("Cloudinary Asset Synced"); 
 } else { 
 execCommand('insertImage', url); 
 toast.success("Media Embedded"); 
 }
 } catch (err) { 
 console.error("Cloudinary Error:", err);
 toast.error("Cloudinary Upload Failed"); 
 } finally { 
 setUploading(false); 
 }
 };

 const handleSaveNews = async (e) => {
 e.preventDefault();
 if (uploading) return;
 if (!newsFormData.title.trim()) {
 toast.error("News Headline Required");
 return;
 }
 setUploading(true);
 try {
 // Get content directly from ref to avoid re-render conflicts
 const content = editorRef.current ? editorRef.current.innerHTML : newsFormData.content;
 const finalData = {
 ...newsFormData,
 content: content,
 date: serverTimestamp()
 };

 if (editingItem) {
 await updateDoc(doc(db, 'news', editingItem.id), finalData);
 toast.success("News Updated");
 } else {
 const id = Date.now().toString();
 await setDoc(doc(db, 'news', id), { ...finalData, id });
 
 // Broadcast Notification
 await setDoc(doc(collection(db, 'notifications')), {
 recipientId: 'all',
 actorName: 'NeonToad Editor',
 message: `New article published: ${finalData.title}`,
 actorAvatar: finalData.image ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg",
 createdAt: serverTimestamp(),
 targetPath: `/news/${id}`,
 readBy: []
 });
 
 toast.success("News Published");
 }

 setShowModal(false);
 fetchData();
 } catch (err) {
 console.error("Save Error:", err);
 toast.error("Transmission Failed");
 } finally {
 setUploading(false);
 }
 };

 const handleSaveAnime = async (e) => {
 e.preventDefault();
 try {
 const data = { ...formData, genres: typeof formData.genres === 'string' ? formData.genres.split(',').map(g => g.trim()) : formData.genres, rating: formData.rating.toString() };
 if (editingItem) { await updateDoc(doc(db, 'anime', editingItem.id), data); toast.success("Updated"); }
 else { 
 const id = Date.now().toString(); 
 await setDoc(doc(db, 'anime', id), { ...data, id: parseInt(id) }); 
 
 // Broadcast Notification
 await setDoc(doc(collection(db, 'notifications')), {
 recipientId: 'all',
 actorName: 'System',
 message: `New Series Added: ${data.title}`,
 actorAvatar: data.image ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg",
 createdAt: serverTimestamp(),
 targetPath: '/anime',
 targetId: id,
 readBy: []
 });

 toast.success("Added"); 
 }
 setShowModal(false); fetchData();
 } catch (err) { toast.error("Sync Failed"); }
 };

 const openDeleteModal = (collectionName, id, title) => {
 setDeleteModal({ isOpen: true, collection: collectionName, id, title, input: '' });
 };

 const handleSafeDelete = async () => {
 if (deleteModal.input !== deleteModal.title) return;
 
 try {
 await deleteDoc(doc(db, deleteModal.collection, deleteModal.id));
 toast.success(`'${deleteModal.title}' deleted successfully`);
 setDeleteModal({ isOpen: false, collection: '', id: '', title: '', input: '' });
 fetchData();
 } catch (err) {
 toast.error('System failure during deletion');
 console.error(err);
 }
 };

 if (checkingAuth) {
 return (
 <div className="min-h-screen bg-transparent flex items-center justify-center p-8 font-sans">
 <p className="text-white text-micro font-medium uppercase animate-pulse">Verifying Identity...</p>
 </div>
 );
 }

 const handleResetViews = async () => {
 if(window.confirm("Are you sure you want to reset ALL anime view counts to 0? This cannot be undone.")) {
 try {
 const q = query(collection(db, 'anime'));
 const snap = await getDocs(q);
 await Promise.all(snap.docs.map(d => updateDoc(doc(db, 'anime', d.id), { viewCount: 0 })));
 toast.success("All view counts have been reset to 0.");
 fetchData();
 } catch (err) {
 console.error("Failed to reset views", err);
 toast.error("Failed to reset views");
 }
 }
 };

 const handlePurgeData = async () => {
 if(window.confirm("PURGE ALL DATA EXCEPT ANIME, EPISODES, USERS, AVATARS, AND ADMINS? This cannot be undone.")) {
 try {
 const collectionsToPurge = ['activeStreams', 'news', 'notifications', 'reels', 'schedules', 'siteConfig', 'featured'];
 for (const colName of collectionsToPurge) {
 const q = query(collection(db, colName));
 const snap = await getDocs(q);
 const deletePromises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
 if (colName === 'reels') {
 for (const d of snap.docs) {
 const cSnap = await getDocs(query(collection(db, 'reels', d.id, 'comments')));
 cSnap.docs.forEach(c => deletePromises.push(deleteDoc(doc(db, 'reels', d.id, 'comments', c.id))));
 }
 }
 await Promise.all(deletePromises);
 }
 toast.success("Data successfully purged!");
 fetchData();
 } catch(err) {
 console.error("Purge failed", err);
 toast.error("Purge failed:" + err.message);
 }
 }
 };

 if (!isAuthorized) {
 return (
 <div className="min-h-screen bg-transparent flex items-center justify-center p-8 font-sans">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-8 text-center">
 <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-md flex items-center justify-center rounded-xl mb-6">
 <BoxyShield size={40} className="text-white" />
 </div>
 <div className="space-y-3">
 <h1 className="text-h3 font-medium text-white">Access Denied</h1>
 <p className="text-micro text-white font-medium leading-relaxed">You must be logged in as an authorized administrator to view this console.</p>
 </div>
 <a href="/" className="inline-block mt-8 text-micro font-medium text-white hover:text-white uppercase transition-colors">
 Return to Surface
 </a>
 </motion.div>
 </div>
 );
 }

 return (
 <div className="h-screen overflow-hidden bg-background flex text-white font-sans selection:bg-primary/20 selection:text-white">
 {/* Mobile Toggle */}
 <button 
 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
 className="lg:hidden fixed top-6 left-6 z-[300] p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white rounded-xl"
 >
 {isSidebarOpen ? <BoxyX size={20} /> : <BoxyMenu size={20} />}
 </button>

 {/* Clean Sidebar Navigation */}
 <aside className={`w-64 bg-neutral-900/95 backdrop-blur-2xl flex flex-col fixed inset-y-0 left-0 z-[200] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
 <div className="p-4 flex items-center justify-center py-8">
 <img loading="lazy" src={logoFull} className="h-10 w-auto object-contain" alt="NeonToad" />
 </div>
 <nav className="flex-grow p-4 py-8 space-y-1 overflow-y-auto no-scrollbar">
 {[
 { id: 'overview', label: 'Analytics & Overview' },
 { id: 'users', label: 'User Management' },
 { id: 'anime', label: 'Anime Compendium' },
 { id: 'avatars', label: 'Avatar Management' },
 { id: 'news', label: 'Editorial' },
 { id: 'schedule', label: 'Release Calendar' },
 { id: 'reels', label: 'Reels Moderation' },
 { id: 'featured', label: 'Hero Carousel' },
 { id: 'ads', label: 'Ad Spaces' },
 { id: 'settings', label: 'Site Configuration' }
 ].map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-5 py-3.5 text-micro font-medium transition-all rounded-xl flex items-center gap-3 ${activeTab === tab.id ? 'bg-white/10 backdrop-blur-md rounded-xl text-white font-medium' : 'text-white hover:text-white hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10'}`}>
 <span className="">{tab.label}</span>
 </button>
 ))}
 </nav>
 <div className="p-8">
 <button onClick={() => setIsAuthorized(false)} className="w-full py-3 rounded-xl text-micro font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors">Logout</button>
 </div>
 </aside>

 {/* Main Workspace */}
 <main className="flex-1 lg:ml-64 h-screen overflow-y-auto relative bg-background">
 <div className="max-w-[1600px] mx-auto p-6 md:p-10 lg:p-12">
 <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
 <div className="space-y-2">
 <h1 className="text-h3 font-medium text-white leading-none capitalize">{activeTab.replace('-', ' ')}</h1>
 <p className="text-[11px] font-medium text-white uppercase">Admin Dashboard</p>
 </div>
 {activeTab !== 'overview' && activeTab !== 'ads' && activeTab !== 'reels' && activeTab !== 'avatars' && (
 <button onClick={() => { 
 setEditingItem(null); 
 setFormData({ title: '', rating: '', description: '', genres: '', image: '', episodes: '', seasons: '', status: 'Finished Airing', type: 'TV Series', studio: '', bannerImage: '', bannerVideo: '', titleLogo: '' });
 setNewsFormData({ title: '', category: 'Latest News', image: '', date: new Date().toLocaleDateString(), content: '', status: 'Published' });
 setScheduleFormData({ dayOfWeek: 'Monday', time: '12:00', animeId: '', animeTitle: '' });
 setFeaturedFormData({ animeId: '', animeTitle: '', customImage: '', customVideo: '', tagline: '', customTitleLogo: '' });
 setShowModal(true); 
 }} className="bg-white/10 backdrop-blur-md rounded-xl text-white px-8 py-3.5 text-micro font-medium hover:bg-neutral-700 transition-all">Add New</button>
 )}
 </header>

 {loading ? (
 <div className="space-y-12">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12">
 {[1, 2, 3].map((i) => (
 <div key={i} className="space-y-4 pl-6 animate-pulse">
 <div className="h-2 w-24 bg-white/10 backdrop-blur-md rounded-xl" />
 <div className="h-10 w-32 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>
 ))}
 </div>
 </div>
 ) : activeTab === 'overview' ? (
 <div className="space-y-8">
 <div className="flex justify-end gap-4">
 <button onClick={handlePurgeData} className="px-6 py-3 bg-red-900/50 hover:bg-red-800 text-white hover:text-white transition-all text-micro font-medium uppercase border border-red-500/30 rounded-xl">
 PURGE UNWANTED DATA
 </button>
 <button onClick={handleResetViews} className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl text-white hover:text-white transition-all text-micro font-medium uppercase">
 Reset All View Counts
 </button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8">
 {[
 { label: 'Total Views', value: stats.totalViews },
 { label: 'Daily Active Users (DAU)', value: stats.dau },
 { label: 'Monthly Active Users (MAU)', value: stats.mau },
 { label: 'Total Users', value: stats.totalUsers },
 { label: 'Anime Titles', value: stats.totalAnime },
 { label: 'News Published', value: stats.totalNews },
 { label: 'Active Reels', value: stats.totalReels },
 { label: 'Streams Active', value: stats.totalSchedules }
 ].map((stat, i) => (
 <div key={i} className="glass-card p-6 space-y-2 border-l-2 border-l-white/20">
 <p className="text-[10px] font-medium text-white uppercase">{stat.label}</p>
 <p className="text-h3 md:text-h2 font-medium text-white leading-none">{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="mt-12 space-y-6">
 <h2 className="text-h4 font-medium text-white">Top Anime by Views</h2>
 <div className="divide-y divide-white/5 pt-4">
 {[...anime]
 .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
 .map((item, index) => (
 <div key={item.id} className="group flex items-center justify-between py-4 hover:bg-white/[0.02] px-6 transition-all">
 <div className="flex items-center gap-6">
 <span className="text-[11px] font-medium text-[#86E95C] tabular-nums w-4">#{index + 1}</span>
 {item.image ? (
 <div className="w-10 h-14 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0 overflow-hidden shadow-lg">
 <img loading="lazy" src={item.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt={item.title} />
 </div>
 ) : (
 <div className="w-10 h-14 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0 flex items-center justify-center">
 <span className="text-[8px] text-white uppercase">No Img</span>
 </div>
 )}
 <h3 className="text-body font-medium text-white group-hover:text-white transition-all ml-2">{item.title}</h3>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-h4 font-medium text-white">{item.viewCount || 0}</span>
 <span className="text-[10px] font-medium text-white uppercase mt-1">Views</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : activeTab === 'users' ? (
 <div className="space-y-8">
 <div className="divide-y divide-white/5 pt-8">
 {usersList.map(u => (
 <div key={u.id} className="group flex items-center justify-between py-6 hover:bg-white/[0.02] px-6 transition-all mb-4">
 <div className="flex items-center gap-6">
 <div className="flex-col">
 <h3 className="text-h4 font-medium text-white group-hover:text-white transition-all">{u.email}</h3>
 <p className="text-[10px] text-white font-medium uppercase mt-1">
 Joined: {new Date(u.createdAt).toLocaleDateString()} {u.isBanned ? <span className="text-white ml-2">• BANNED</span> : null}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
 <button onClick={() => handlePromoteUser(u.id, u.email)} className="text-micro font-medium text-white hover:text-[#86E95C] transition-colors">Promote to Admin</button>
 <button onClick={() => handleBanUser(u.id, u.email, u.isBanned)} className="text-micro font-medium text-white hover:text-white transition-colors">
 {u.isBanned ? 'Unban' : 'Ban User'}
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : activeTab === 'anime' ? (
 selectedAnimeForEpisodes ? (
 <EpisodeManager 
 anime={selectedAnimeForEpisodes} 
 onBack={() => setSelectedAnimeForEpisodes(null)} 
 />
 ) : (
 <div className="space-y-8">
 <div className="relative group">
 <BoxySearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white group-focus-within:text-[#86E95C] transition-colors" size={20} />
 <input 
 type="text" 
 value={animeSearchQuery}
 onChange={e => setAnimeSearchQuery(e.target.value)}
 placeholder="Search series to add episodes..."
 className="w-full bg-white/[0.03] py-5 pl-16 pr-6 rounded-md text-micro font-medium text-white outline-none focus: transition-all placeholder:text-white"
 />
 </div>
 <div className="divide-y divide-white/5">
 {anime
 .filter(item => item.title.toLowerCase().includes(animeSearchQuery.toLowerCase()))
 .map(item => (
 <div key={item.id} className="group flex items-center justify-between py-10 hover:bg-white/[0.02] px-6 transition-all">
 <div className="flex items-center gap-6">
 <span className="text-[11px] font-medium text-white tabular-nums w-4">0{item.id % 9}</span>
 {item.image ? (
 <div className="w-12 h-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0 overflow-hidden shadow-lg">
 <img loading="lazy" src={item.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" alt={item.title} />
 </div>
 ) : (
 <div className="w-12 h-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0 flex items-center justify-center">
 <span className="text-[10px] text-white uppercase">No Img</span>
 </div>
 )}
 <h3 className="text-h4 font-medium text-white group-hover:text-white transition-all ml-2">{item.title}</h3>
 </div>
 <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
 <button onClick={() => setSelectedAnimeForEpisodes(item)} className="text-micro font-medium text-[#86E95C] hover:text-[#86E95C]/80 transition-colors">Episodes</button>
 <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="text-micro font-medium text-white hover:text-white transition-colors">Edit</button>
 <button onClick={() => openDeleteModal('anime', item.id, item.title)} className="text-micro font-medium text-white hover:text-white transition-colors">Delete</button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )
 ) : activeTab === 'news' ? (
 <div className="space-y-12">
 <div className="divide-y divide-white/5">
 {newsList.map(item => (
 <div key={item.id} className="group flex items-center justify-between py-10 hover:bg-white/[0.02] px-6 transition-all">
 <div className="flex items-center gap-8">
 <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0 overflow-hidden"><img loading="lazy" src={item.image} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="" /></div>
 <h3 className="text-h4 font-medium text-white group-hover:text-white transition-all line-clamp-1">{item.title}</h3>
 </div>
 <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => { setEditingItem(item); setNewsFormData(item); setShowModal(true); }} className="text-micro font-medium text-white hover:text-[#86E95C] transition-colors">Edit</button>
 <button onClick={() => openDeleteModal('news', item.id, item.title)} className="text-micro font-medium text-white hover:text-white transition-colors">Delete</button>
 </div>
 </div>
 ))}
 </div>
 </div>

 ) : activeTab === 'schedule' ? (
 <div className="space-y-16">
 <div className="space-y-6">
 <h2 className="text-h4 font-medium text-white">Queued Episodes (Auto-Release)</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
 {queuedEpisodes.length === 0 ? (
 <p className="text-white text-micro font-medium">No queued episodes waiting for release.</p>
 ) : queuedEpisodes.map(ep => (
 <div key={ep.id} className="group p-6 space-y-6 hover:bg-white/[0.02] transition-all relative">
 <div className="flex gap-4 items-start">
 {ep.animeImage && <img loading="lazy" src={ep.animeImage} className="w-12 h-16 object-cover bg-white/5 backdrop-blur-md rounded-xl border border-white/10" alt="" />}
 <div className="flex-1 min-w-0">
 <p className={`text-[10px] font-medium uppercase mb-1 ${
 ep.releaseDate 
 ? (ep.releaseDate.toDate() <= new Date() ? 'text-[#86E95C]' : 'text-orange-500') 
 : 'text-orange-500'
 }`}>
 {ep.releaseDate 
 ? (ep.releaseDate.toDate() <= new Date() ? 'Released' : 'Scheduled') 
 : 'Pending Schedule'}
 </p>
 <h4 className="text-micro font-medium text-white line-clamp-1">{ep.animeTitle}</h4>
 <p className="text-micro text-white">S{ep.season} E{ep.episodeNumber}</p>
 </div>
 </div>
 {ep.releaseDate && (
 <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-micro text-white font-medium">
 Releases: {ep.releaseDate.toDate().toLocaleString()}
 </div>
 )}
 <button 
 onClick={() => setReleaseEpisodeModal({ isOpen: true, episode: ep, date: '', time: '' })}
 className="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all py-2 text-micro font-medium uppercase"
 >
 Set Release Date
 </button>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-6">
 <h2 className="text-h4 font-medium text-white">Weekly Airing Schedules (Generic)</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
 {schedules.map(s => (
 <div key={s.id} className="group p-8 space-y-6 hover:bg-white/[0.02] transition-all">
 <div className="flex justify-between items-start">
 <div>
 <span className="text-[10px] font-medium text-white uppercase block mb-2">Every {s.dayOfWeek || s.date}</span>
 <span className="text-h2 font-medium text-[#86E95C] leading-none">{s.time}</span>
 </div>
 <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
 <button onClick={() => { setEditingItem(s); setScheduleFormData(s); setShowModal(true); }} className="text-micro font-medium text-white hover:text-white">Edit</button>
 <button onClick={() => openDeleteModal('schedules', s.id, s.animeTitle || s.title)} className="text-micro font-medium text-white hover:text-white">Delete</button>
 </div>
 </div>
 <h4 className="text-h4 font-medium text-white group-hover:text-[#86E95C] transition-all">{s.animeTitle || s.title}</h4>
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : activeTab === 'featured' ? (
 <div className="space-y-12">
 <div className="grid grid-cols-1 gap-8 pt-12">
 {featuredList.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
 <p className="text-micro font-medium text-white">No featured anime.</p>
 <p className="text-[10px] text-white">Click"Add New" to feature an anime on the homepage.</p>
 </div>
 ) : featuredList.map(f => (
 <div key={f.id} className="group flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all">
 <div className="flex items-center gap-8">
 {f.customImage && <div className="w-32 h-20 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0"><img loading="lazy" src={f.customImage} className="w-full h-full object-cover" alt="" /></div>}
 <div className="space-y-2">
 <h3 className="text-h3 font-medium text-white">{f.animeTitle}</h3>
 <p className="text-micro text-white">{f.tagline}</p>
 </div>
 </div>
 <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all">
 <button onClick={() => { setEditingItem(f); setFeaturedFormData(f); setShowModal(true); }} className="text-micro font-medium text-white hover:text-white">Edit</button>
 <button onClick={() => openDeleteModal('featured', f.id, f.animeTitle)} className="text-micro font-medium text-white hover:text-white">Remove</button>
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : activeTab === 'settings' ? (
 <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-12">
 <div className="grid grid-cols-1 gap-8">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Maintenance Mode</p>
 <div className="bg-white/[0.03] p-8 flex items-center justify-between">
 <span className="text-white font-medium">Enable Maintenance Screen</span>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" 
 className="sr-only peer rounded-xl bg-white/5 backdrop-blur-md border border-white/10" 
 checked={settingsFormData.maintenanceMode}
 onChange={e => setSettingsFormData({ ...settingsFormData, maintenanceMode: e.target.checked })}
 />
 <div className="w-12 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after: after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/40"></div>
 </label>
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Brand Theme Color</p>
 <div className="bg-white/[0.03] p-8 flex items-center gap-6">
 <input 
 type="color" 
 value={settingsFormData.themeColor} 
 onChange={e => setSettingsFormData({ ...settingsFormData, themeColor: e.target.value })} 
 className="w-12 h-12 rounded cursor-pointer bg-transparent border-none"
 />
 <input 
 type="text" 
 value={settingsFormData.themeColor} 
 onChange={e => setSettingsFormData({ ...settingsFormData, themeColor: e.target.value })} 
 className="flex-1 bg-transparent border-none text-h4 font-medium text-white outline-none" 
 />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Global SEO Title</p>
 <div className="bg-white/[0.03] p-8">
 <input 
 type="text" 
 value={settingsFormData.seoTitle} 
 onChange={e => setSettingsFormData({ ...settingsFormData, seoTitle: e.target.value })} 
 className="w-full bg-transparent border-none text-h4 font-medium text-white outline-none" 
 />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Global SEO Description</p>
 <div className="bg-white/[0.03] p-8">
 <textarea 
 value={settingsFormData.seoDescription} 
 onChange={e => setSettingsFormData({ ...settingsFormData, seoDescription: e.target.value })} 
 className="w-full bg-transparent border-none text-h4 font-medium text-white outline-none h-32 resize-none" 
 />
 </div>
 </div>
 <div className="pt-8">
 <button type="submit" className="w-full bg-[#86E95C] text-black font-medium py-4 hover:bg-[#86E95C]/80 transition-colors uppercase text-micro rounded-xl">
 Save Configuration
 </button>
 </div>
 </div>
 </form>
 ) : activeTab === 'reels' ? (
 <ReelModerator reelsList={reelsList} onRefresh={fetchData} />
 ) : activeTab === 'avatars' ? (
 <AdminAvatars />
 ) : activeTab === 'ads' ? (
 <div className="max-w-3xl space-y-24">
 <AdForm id="ad1" label="Header placement" initialData={ad1Data} />
 <AdForm id="ad2" label="Footer placement" initialData={ad2Data} />
 </div>
 ) : null}
 </div>
 </main>

 {/* Custom Safe Delete Modal */}
 <AnimatePresence>
 {deleteModal.isOpen && (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }} 
 className="fixed inset-0 z-[500] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6 font-sans"
 >
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className="w-full max-w-lg glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-12 space-y-12 backdrop-blur-3xl"
 >
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">High-Level Threat Detected!</p>
 <h2 className="text-h2 font-medium text-white leading-tight">Cast Obliteration Magic</h2>
 <p className="text-micro text-white leading-relaxed">
 This magic cannot be undone. To verify your guild rank, please chant the true name below:
 </p>
 <div className="py-3 px-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 inline-block">
 <span className="text-micro font-medium text-white select-none">{deleteModal.title}</span>
 </div>
 </div>

 <div className="space-y-6">
 <input 
 autoFocus
 value={deleteModal.input}
 onChange={(e) => setDeleteModal({...deleteModal, input: e.target.value})}
 className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-white font-medium outline-none focus: transition-all"
 placeholder="Chant the true name..."
 autoComplete="off"
 />
 <div className="flex gap-4 pt-4">
 <button onClick={() => setDeleteModal({ isOpen: false, collection: '', id: '', title: '', input: '' })} className="flex-1 py-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl text-white text-micro font-medium transition-all">ABORT</button>
 <button 
 onClick={handleSafeDelete}
 disabled={deleteModal.input !== deleteModal.title}
 className="flex-1 py-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white text-micro font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 shadow-xl hover:text-white disabled:hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:"
 >
 OBLITERATE
 </button>
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Episode Release Modal */}
 <AnimatePresence>
 {releaseEpisodeModal.isOpen && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6 font-sans">
 <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8 space-y-8 backdrop-blur-3xl">
 <div className="space-y-2">
 <h3 className="text-h4 font-medium text-white">Schedule Episode Release</h3>
 <p className="text-micro text-white">
 {releaseEpisodeModal.episode?.animeTitle} - S{releaseEpisodeModal.episode?.season} E{releaseEpisodeModal.episode?.episodeNumber}
 </p>
 </div>
 <form onSubmit={handleReleaseQueuedEpisode} className="space-y-6">
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Release Date</label>
 <input required type="date" value={releaseEpisodeModal.date} onChange={e => setReleaseEpisodeModal({...releaseEpisodeModal, date: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-white outline-none focus:border-[#86E95C]/50" />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Release Time</label>
 <input required type="time" value={releaseEpisodeModal.time} onChange={e => setReleaseEpisodeModal({...releaseEpisodeModal, time: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-white outline-none focus:border-[#86E95C]/50" />
 </div>
 <div className="flex gap-4 pt-4">
 <button type="button" onClick={() => setReleaseEpisodeModal({ isOpen: false, episode: null, date: '', time: '' })} className="flex-1 py-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl text-white text-micro font-medium transition-all">CANCEL</button>
 <button type="submit" disabled={uploading} className="flex-1 py-4 bg-[#86E95C] text-black text-micro font-medium hover:bg-[#86E95C]/80 transition-all rounded-xl">{uploading ? 'SCHEDULING...' : 'SET ALARM'}</button>
 </div>
 </form>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Editor Modal */}
 <AnimatePresence>
 {showModal && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-white/10 backdrop-blur-3xl flex flex-col overflow-hidden font-sans">
 <div className="p-8 lg:p-12 flex justify-between items-center bg-transparent relative z-20">
 <div className="flex items-center gap-4">
 <button onClick={() => setShowModal(false)} className="text-micro font-medium text-white hover:text-white transition-colors">Close News</button>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-micro font-medium text-white">{editingItem ? 'Edit Article' : 'Create Article'}</span>
 </div>
 <button onClick={activeTab === 'news' ? handleSaveNews : activeTab === 'schedule' ? handleSaveSchedule : activeTab === 'featured' ? handleSaveFeatured : handleSaveAnime}
 disabled={uploading}
 className="bg-white/90 text-background px-10 py-3.5 text-micro font-semibold hover:bg-white transition-all disabled:opacity-50 rounded-xl"
 >
 {uploading ? 'Casting...' : 'Seal the Pact'}
 </button>
 </div>

 <div className="flex-grow overflow-y-auto bg-transparent flex flex-col items-center">
 <div className="w-full max-w-4xl p-10 lg:py-24 space-y-24">
 {activeTab === 'news' ? (
 <>
 <div className="space-y-20">
 {/* Header Section */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-16">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">News Category</p>
 <div className="relative group">
 <select 
 value={newsFormData.category} 
 onChange={e => setNewsFormData({ ...newsFormData, category: e.target.value })} 
 className="w-full bg-white/[0.03] px-6 py-4 text-micro font-medium text-white outline-none focus: transition-all appearance-none cursor-pointer"
 >
 <option value="Latest News" className="bg-[#0D0D0D] text-white">Latest News</option>
 <option value="Announcements" className="bg-[#0D0D0D] text-white">Announcements</option>
 <option value="Manga" className="bg-[#0D0D0D] text-white">Manga</option>
 </select>
 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 transition-all">
 <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Featured Visual</p>
 <div className="flex gap-4">
 <div 
 onClick={() => {
 const i = document.createElement('input');
 i.type = 'file';
 i.accept = 'image/*';
 i.onchange = (e) => handleFileUpload(e, 'featured');
 i.click();
 }} 
 className="group relative flex-grow h-[54px] bg-white/[0.03] flex items-center px-6 cursor-pointer hover: hover:bg-white/[0.05] transition-all overflow-hidden"
 >
 {uploading ? (
 <div className="flex items-center gap-3">
 <div style={{ borderRadius: '50%' }} className="w-4 h-4 border-2 border-t-white animate-spin" />
 <span className="text-[10px] font-medium text-white uppercase">Syncing...</span>
 </div>
 ) : newsFormData.image ? (
 <div className="flex items-center gap-4 w-full">
 <img loading="lazy" src={newsFormData.image} className="w-8 h-8 object-cover rounded-xl" alt="" />
 <span className="text-[10px] font-medium text-white uppercase truncate">Asset Linked</span>
 </div>
 ) : (
 <div className="flex items-center gap-3">
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-40"><path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
 <span className="text-[10px] font-medium text-white transition-colors uppercase">Upload File</span>
 </div>
 )}
 </div>
 <div className="w-1/3 h-[54px] bg-white/[0.03] flex items-center px-4 focus-within: transition-all">
 <input 
 value={newsFormData.image}
 onChange={(e) => setNewsFormData({ ...newsFormData, image: e.target.value })}
 placeholder="Paste URL instead..."
 className="w-full bg-transparent border-none text-[10px] font-medium text-white outline-none placeholder:text-white uppercase"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Editor Section */}
 <div className="space-y-12">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Title</p>
 <div className="bg-white/[0.03] p-8">
 <input 
 value={newsFormData.title} 
 onChange={e => setNewsFormData({ ...newsFormData, title: e.target.value })} 
 placeholder="Enter article headline..." 
 className="w-full bg-transparent border-none text-h2 font-semibold text-white outline-none placeholder:text-white leading-tight" 
 />
 </div>
 </div>

 <div className="space-y-4 col-span-2">
 <p className="text-[10px] font-medium text-white uppercase">News Content</p>
 <div className="bg-white/[0.02] flex flex-col">
 {/* Toolbar */}
 <div className="flex flex-wrap items-center gap-1 p-4 bg-white/10 backdrop-blur-xl sticky top-0 z-20">
 {/* History */}
 <div className="flex items-center gap-1 pr-3 mr-2">
 <button onClick={() => { execCommand('undo'); updateActiveStyles(); }} className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white transition-all rounded-xl" title="Undo (Ctrl+Z)">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
 </button>
 <button onClick={() => { execCommand('redo'); updateActiveStyles(); }} className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white transition-all rounded-xl" title="Redo (Ctrl+Y)">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
 </button>
 </div>

 {/* Formatting */}
 <div className="flex items-center gap-1 pr-3 mr-2">
 <button onClick={() => { execCommand('bold'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.bold ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Bold">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
 </button>
 <button onClick={() => { execCommand('italic'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.italic ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Italic">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
 </button>
 <button onClick={() => { execCommand('underline'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.underline ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Underline">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
 </button>
 </div>

 {/* Alignment */}
 <div className="flex items-center gap-1 pr-3 mr-2">
 <button onClick={() => { execCommand('justifyLeft'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.justifyLeft ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Align Left">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
 </button>
 <button onClick={() => { execCommand('justifyCenter'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.justifyCenter ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Align Center">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
 </button>
 <button onClick={() => { execCommand('justifyRight'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.justifyRight ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Align Right">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
 </button>
 </div>

 {/* Lists */}
 <div className="flex items-center gap-1 pr-3 mr-2">
 <button onClick={() => { execCommand('insertUnorderedList'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.insertUnorderedList ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Bullet List">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
 <rect x="3" y="5" width="2" height="2" fill="currentColor" stroke="none"/>
 <rect x="3" y="11" width="2" height="2" fill="currentColor" stroke="none"/>
 <rect x="3" y="17" width="2" height="2" fill="currentColor" stroke="none"/>
 </svg>
 </button>
 <button onClick={() => { execCommand('insertOrderedList'); updateActiveStyles(); }} className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.insertOrderedList ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} title="Numbered List">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
 <path d="M4 6h1v4M4 10h2M4 18h2" strokeWidth="2"/>
 </svg>
 </button>
 </div>

 {/* Utilities */}
 <div className="flex flex-grow items-center justify-between gap-1">
 <div className="flex items-center gap-1">
 <select 
 onChange={(e) => { execCommand('fontSize', e.target.value); updateActiveStyles(); }}
 className="h-9 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 px-3 text-[10px] font-medium text-white outline-none hover:bg-white/10 shadow-xl hover:text-white transition-all cursor-pointer rounded-xl mr-1 appearance-none"
 title="Font Size"
 defaultValue="3"
 >
 <option value="1" className="bg-[#0D0D0D] text-white">10px</option>
 <option value="2" className="bg-[#0D0D0D] text-white">13px</option>
 <option value="3" className="bg-[#0D0D0D] text-white">16px</option>
 <option value="4" className="bg-[#0D0D0D] text-white">18px</option>
 <option value="5" className="bg-[#0D0D0D] text-white">24px</option>
 <option value="6" className="bg-[#0D0D0D] text-white">32px</option>
 <option value="7" className="bg-[#0D0D0D] text-white">48px</option>
 </select>

 <select 
 onChange={(e) => {
 const selection = window.getSelection();
 if (selection.rangeCount > 0) {
 const range = selection.getRangeAt(0);
 const walk = document.createTreeWalker(
 range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode,
 NodeFilter.SHOW_ELEMENT,
 { acceptNode: (node) => ['DIV', 'P', 'H1', 'H2', 'H3', 'LI'].includes(node.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP }
 );
 
 let node;
 while (node = walk.nextNode()) {
 if (selection.containsNode(node, true)) {
 node.style.lineHeight = e.target.value;
 }
 }
 // Also set as base style for the editor so new lines inherit it
 if (editorRef.current) {
 editorRef.current.style.lineHeight = e.target.value;
 }
 
 setNewsFormData(prev => ({ ...prev, content: editorRef.current.innerHTML }));
 }
 }}
 className="h-9 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 px-3 text-[10px] font-medium text-white outline-none hover:bg-white/10 shadow-xl hover:text-white transition-all cursor-pointer rounded-xl mr-1 appearance-none"
 title="Line Height"
 defaultValue="1.6"
 >
 <option value="1" className="bg-[#0D0D0D] text-white">1.0</option>
 <option value="1.2" className="bg-[#0D0D0D] text-white">1.2</option>
 <option value="1.4" className="bg-[#0D0D0D] text-white">1.4</option>
 <option value="1.6" className="bg-[#0D0D0D] text-white">1.6</option>
 <option value="1.8" className="bg-[#0D0D0D] text-white">1.8</option>
 <option value="2.0" className="bg-[#0D0D0D] text-white">2.0</option>
 </select>

 <button onClick={() => { const color = prompt('Enter Color (Hex/Name):', '#86E95C'); if(color) execCommand('foreColor', color); }} className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl transition-all text-white hover:text-white rounded-xl" title="Text Color">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"/><path d="M17 16l-5-12-5 12"/><path d="M7 12h10"/></svg>
 </button>

 <button onClick={() => execCommand('insertHorizontalRule')} className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl transition-all text-white hover:text-white rounded-xl" title="Horizontal Rule">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
 </button>

 <button 
 onClick={() => {
 const isQuote = document.queryCommandValue('formatBlock') === 'blockquote';
 execCommand('formatBlock', isQuote ? 'div' : 'blockquote');
 updateActiveStyles();
 }} 
 className={`w-9 h-9 flex items-center justify-center transition-all rounded-xl ${activeStyles.blockquote ? 'bg-white text-background shadow-lg shadow-white/10' : 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 shadow-xl hover:text-white'}`} 
 title="Quote"
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 2.5 1 4.5 1 6zm11 0c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 2.5 1 4.5 1 6z"/></svg>
 </button>

 <button onClick={() => { const url = prompt('Enter URL:'); if(url) execCommand('createLink', url); }} className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl transition-all text-white hover:text-white rounded-xl" title="Insert Link">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
 </button>
 </div>

 <button 
 onClick={() => {
 const url = prompt('Enter Image URL:');
 if (url) {
 execCommand('insertImage', url);
 updateActiveStyles();
 toast.success("External Asset Linked");
 }
 }} 
 className="flex items-center gap-3 px-4 h-9 bg-white/10 backdrop-blur-md rounded-xl hover:bg-neutral-700 text-[9px] font-medium transition-all text-[#86E95C] rounded-xl border-[#86E95C]/20"
 >
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
 MEDIA
 </button>
 </div>
 </div>

 <div
 ref={editorRef}
 contentEditable
 suppressContentEditableWarning
 onInput={(e) => {
 const html = e.currentTarget.innerHTML;
 setNewsFormData(prev => ({ ...prev, content: html }));
 updateActiveStyles();
 }}
 className="w-full h-[50vh] bg-transparent border-none text-body text-white outline-none resize-none" 
 placeholder="Start writing the news content..."
 />
 </div>
 </div>
 </div>
 </div>
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={(e) => handleFileUpload(e, 'content')} 
 accept="image/*" 
 className="hidden" 
 />
 </>
 ) : activeTab === 'schedule' ? (
 <form onSubmit={handleSaveSchedule} className="space-y-12">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Day of the Week</p>
 <div className="bg-white/[0.03] p-8">
 <select value={scheduleFormData.dayOfWeek || 'Monday'} onChange={e => setScheduleFormData({ ...scheduleFormData, dayOfWeek: e.target.value })} className="w-full bg-transparent border-none text-h3 font-semibold text-white outline-none appearance-none cursor-pointer">
 {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
 <option key={d} value={d} className="bg-[#0D0D0D] text-white">{d}</option>
 ))}
 </select>
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Stream Time</p>
 <div className="bg-white/[0.03] p-8">
 <input type="time" value={scheduleFormData.time} onChange={e => setScheduleFormData({ ...scheduleFormData, time: e.target.value })} className="w-full bg-transparent border-none text-h3 font-semibold text-white outline-none custom-time-input" />
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Link to Anime</p>
 <div className="bg-white/[0.03] p-8">
 <select 
 value={scheduleFormData.animeId} 
 onChange={e => {
 const selected = anime.find(a => String(a.id) === String(e.target.value));
 setScheduleFormData({ ...scheduleFormData, animeId: selected?.id || '', animeTitle: selected?.title || '' });
 }}
 className="w-full bg-transparent border-none text-h3 font-semibold text-white outline-none appearance-none cursor-pointer"
 >
 <option value="" className="bg-[#0D0D0D] text-white">-- Select Anime --</option>
 {anime.map(a => (
 <option key={a.id} value={a.id} className="bg-[#0D0D0D] text-white">{a.title}</option>
 ))}
 </select>
 </div>
 </div>
 </form>
 ) : activeTab === 'featured' ? (
 <form onSubmit={handleSaveFeatured} className="space-y-12">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Featured Anime</p>
 <div className="bg-white/[0.03] p-8">
 <select 
 value={featuredFormData.animeId} 
 onChange={e => {
 const selected = anime.find(a => String(a.id) === String(e.target.value));
 setFeaturedFormData({ ...featuredFormData, animeId: selected?.id || '', animeTitle: selected?.title || '' });
 }}
 className="w-full bg-transparent border-none text-h3 font-semibold text-white outline-none appearance-none cursor-pointer"
 >
 <option value="" className="bg-[#0D0D0D] text-white">-- Select Anime --</option>
 {anime.map(a => (
 <option key={a.id} value={a.id} className="bg-[#0D0D0D] text-white">{a.title}</option>
 ))}
 </select>
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Tagline / Catchphrase</p>
 <div className="bg-white/[0.03] p-8">
 <input value={featuredFormData.tagline} onChange={e => setFeaturedFormData({ ...featuredFormData, tagline: e.target.value })} className="w-full bg-transparent border-none text-h3 font-semibold text-white outline-none placeholder:text-white" placeholder="e.g. The #1 show of the season!" />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Custom Hero Image URL (Optional)</p>
 <div className="bg-white/[0.03] p-8">
 <input value={featuredFormData.customImage} onChange={e => setFeaturedFormData({ ...featuredFormData, customImage: e.target.value })} className="w-full bg-transparent border-none text-h4 font-medium text-white outline-none placeholder:text-white" placeholder="Leave blank to use default anime poster..." />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Custom Background Video URL (Optional)</p>
 <div className="bg-white/[0.03] p-8">
 <input value={featuredFormData.customVideo} onChange={e => setFeaturedFormData({ ...featuredFormData, customVideo: e.target.value })} className="w-full bg-transparent border-none text-h4 font-medium text-white outline-none placeholder:text-white" placeholder="Paste YouTube link or direct video URL (e.g. .mp4)..." />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Custom Title Logo URL (Optional PNG)</p>
 <div className="bg-white/[0.03] p-8">
 <input value={featuredFormData.customTitleLogo} onChange={e => setFeaturedFormData({ ...featuredFormData, customTitleLogo: e.target.value })} className="w-full bg-transparent border-none text-h4 font-medium text-white outline-none placeholder:text-white" placeholder="Paste logo image URL..." />
 </div>
 </div>
 </form>
 ) : (
 <form onSubmit={handleSaveAnime} className="space-y-12">
 {/* Primary Metadata */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {[
 { label: 'STATUS', value: formData.status, key: 'status', placeholder: 'e.g. Finished Airing' },
 { label: 'TYPE', value: formData.type, key: 'type', placeholder: 'e.g. TV Series' },
 { label: 'STUDIO', value: formData.studio, key: 'studio', placeholder: 'e.g. Mappa' }
 ].map((field) => (
 <div key={field.key} className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">{field.label}</p>
 <div className="bg-white/[0.03] p-6">
 <input 
 value={field.value} 
 onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} 
 className="w-full bg-transparent border-none text-body font-medium text-white outline-none placeholder:text-white" 
 placeholder={field.placeholder} 
 />
 </div>
 </div>
 ))}
 </div>

 {/* Title and Rating */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Anime Title</p>
 <div className="bg-white/[0.03] p-8">
 <input 
 value={formData.title} 
 onChange={e => setFormData({ ...formData, title: e.target.value })} 
 className="w-full bg-transparent border-none text-h2 font-semibold text-white outline-none placeholder:text-white" 
 placeholder="Enter anime title..."
 />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Rating</p>
 <div className="bg-white/[0.03] p-8">
 <input 
 value={formData.rating} 
 onChange={e => setFormData({ ...formData, rating: e.target.value })} 
 className="w-full bg-transparent border-none text-h2 font-semibold text-white outline-none placeholder:text-white tabular-nums" 
 placeholder="0.0"
 />
 </div>
 </div>
 </div>

 {/* Media and Synopsis */}
 <div className="space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Poster Image (URL)</p>
 <div className="bg-white/[0.03] p-6">
 <input 
 value={formData.image || ''} 
 onChange={e => setFormData({ ...formData, image: e.target.value })} 
 className="w-full bg-transparent border-none text-micro font-medium text-white outline-none focus:text-white transition-all" 
 placeholder="https://..."
 />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Hero Banner Image (Landscape)</p>
 <div className="bg-white/[0.03] p-6">
 <input 
 value={formData.bannerImage || ''} 
 onChange={e => setFormData({ ...formData, bannerImage: e.target.value })} 
 className="w-full bg-transparent border-none text-micro font-medium text-white outline-none focus:text-white transition-all" 
 placeholder="https://..."
 />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Hero Banner Video (Embed URL)</p>
 <div className="bg-white/[0.03] p-6">
 <input 
 value={formData.bannerVideo || ''} 
 onChange={e => setFormData({ ...formData, bannerVideo: e.target.value })} 
 className="w-full bg-transparent border-none text-micro font-medium text-white outline-none focus:text-white transition-all" 
 placeholder="YouTube URL..."
 />
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Anime Synopsis</p>
 <div className="bg-white/[0.03] p-8">
 <textarea 
 value={formData.description} 
 onChange={e => setFormData({ ...formData, description: e.target.value })} 
 className="w-full bg-transparent border-none text-h4 font-medium text-white outline-none h-48 resize-none leading-relaxed placeholder:text-white" 
 placeholder="Provide a detailed summary..."
 />
 </div>
 </div>
 </div>
 </form>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};

const EpisodeManager = ({ anime, onBack }) => {
 const [episodes, setEpisodes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [editingEp, setEditingEp] = useState(null);
 const [formData, setFormData] = useState({
 episodeNumber: '', season: 1, title: '', thumbnail: '', duration: '', videoUrl: '', description: '', status: 'published'
 });

 const fetchEpisodes = async (showLoader = false) => {
 if (showLoader) setLoading(true);
 try {
 let q = query(collection(db, 'episodes'), where('animeId', '==', String(anime.id)));
 let querySnapshot = await getDocs(q);
 
 if (querySnapshot.empty && !isNaN(Number(anime.id))) {
 q = query(collection(db, 'episodes'), where('animeId', '==', Number(anime.id)));
 querySnapshot = await getDocs(q);
 }
 
 const eps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 eps.sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
 setEpisodes(eps);
 } catch (err) {
 console.error(err);
 } finally {
 if (showLoader) setLoading(false);
 }
 };

 useEffect(() => {
 fetchEpisodes(true);
 }, [anime.id]);

 const handleSave = async (e) => {
 e.preventDefault();
 try {
 const dataToSave = {
 ...formData,
 animeId: String(anime.id),
 episodeNumber: Number(formData.episodeNumber),
 season: Number(formData.season)
 };
 if (editingEp) {
 await updateDoc(doc(db, 'episodes', editingEp.id), dataToSave);
 toast.success("Episode Updated");
 } else {
 const id = Date.now().toString();
 await setDoc(doc(db, 'episodes', id), { ...dataToSave, createdAt: serverTimestamp() });
 
 // Only update Anime lastEpisodeAddedAt if it's actually published now
 if (dataToSave.status !== 'queued') {
 await updateDoc(doc(db, 'anime', String(anime.id)), {
 lastEpisodeAddedAt: serverTimestamp()
 });

 // Broadcast Notification
 await setDoc(doc(collection(db, 'notifications')), {
 recipientId: 'all',
 actorName: 'System',
 message: `New Episode Released: ${anime.title} - Episode ${formData.episodeNumber}`,
 actorAvatar: anime.image || formData.thumbnail ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg",
 createdAt: serverTimestamp(),
 targetPath: '/watch',
 targetId: id,
 readBy: []
 });
 }

 toast.success(dataToSave.status === 'queued' ?"Episode Queued" :"Episode Added");
 }
 setShowModal(false);
 fetchEpisodes();
 } catch (err) {
 toast.error("Failed to save episode");
 console.error(err);
 }
 };

 const handleDelete = async (id) => {
 if(window.confirm("Are you sure you want to delete this episode?")) {
 try {
 await deleteDoc(doc(db, 'episodes', id));
 toast.success("Episode Deleted");
 fetchEpisodes();
 } catch (err) {
 toast.error("Failed to delete");
 }
 }
 };

 return (
 <div className="space-y-8 animate-in fade-in zoom-in duration-300">
 <div className="flex items-center justify-between pb-6">
 <div className="flex items-center gap-4">
 <button onClick={onBack} className="text-white hover:text-white transition-colors rounded-xl">
 <BoxyChevron direction="left" size={24} />
 </button>
 <div>
 <h2 className="text-h3 font-medium text-white">{anime.title} Episodes</h2>
 <p className="text-micro text-white font-medium">Manage video links and descriptions</p>
 </div>
 </div>
 <button onClick={() => { 
 setEditingEp(null); 
 setFormData({ episodeNumber: episodes.length + 1, season: 1, title: '', thumbnail: '', duration: '', videoUrl: '', description: '', status: 'published' });
 setShowModal(true); 
 }} className="bg-white/10 backdrop-blur-md rounded-xl text-white px-6 py-2.5 text-micro font-medium hover:bg-neutral-700 transition-all">
 Add Episode
 </button>
 </div>

 {loading ? (
 <div className="animate-pulse h-24 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 w-full" />
 ) : episodes.length === 0 ? (
 <div className="py-12 text-center text-white text-micro font-medium">No episodes found. Add one to begin.</div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {episodes.map(ep => (
 <div key={ep.id} className="bg-white/[0.02] p-4 flex flex-col gap-4 group">
 <div className="aspect-video bg-white/10 overflow-hidden relative">
 {ep.thumbnail ? (
 <img loading="lazy" src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-white"><BoxyPlay size={32} /></div>
 )}
 <div className="absolute top-2 left-2 bg-neutral-900/80 px-2 py-1 text-[10px] font-medium text-white rounded-xl">
 S{ep.season} E{ep.episodeNumber}
 </div>
 {ep.status === 'queued' && (
 <div className="absolute top-2 right-2 bg-orange-500/80 px-2 py-1 text-[10px] font-medium text-white rounded-xl uppercase">
 Queued
 </div>
 )}
 </div>
 <div>
 <h4 className="text-micro font-medium text-white truncate">{ep.title || `Episode ${ep.episodeNumber}`}</h4>
 <p className="text-[10px] text-white truncate">{ep.videoUrl || 'No video URL set'}</p>
 </div>
 <div className="flex gap-2 mt-auto pt-4">
 <button onClick={() => { setEditingEp(ep); setFormData(ep); setShowModal(true); }} className="flex-1 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:text-white hover:bg-white/10 shadow-xl text-micro font-medium transition-colors">Edit</button>
 <button onClick={() => handleDelete(ep.id)} className="flex-1 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover: hover:text-white hover:bg-white/10 shadow-xl text-micro font-medium transition-colors">Delete</button>
 </div>
 </div>
 ))}
 </div>
 )}

 {showModal && (
 <div className="fixed inset-0 z-[400] bg-neutral-900/80 flex items-center justify-center p-4">
 <div className="glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 backdrop-blur-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 space-y-8">
 <div className="flex justify-between items-center">
 <h3 className="text-h4 font-medium text-white">{editingEp ? 'Edit Episode' : 'Add New Episode'}</h3>
 <button onClick={() => setShowModal(false)} className="text-white hover:text-white"><BoxyX size={24} /></button>
 </div>
 
 <form onSubmit={handleSave} className="space-y-6">
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Episode Number</label>
 <input type="number" required value={formData.episodeNumber} onChange={e => setFormData({...formData, episodeNumber: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-white outline-none focus:" />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Season</label>
 <input type="number" required value={formData.season} onChange={e => setFormData({...formData, season: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-white outline-none focus:" />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Episode Title</label>
 <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-white outline-none focus:" placeholder="e.g. The Beginning" />
 </div>
 
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Video URL (YouTube, MP4, etc)</label>
 <input type="text" required value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-white outline-none focus:" placeholder="https://youtube.com/watch?v=..." />
 </div>
 
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Thumbnail URL</label>
 <input type="text" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-white outline-none focus:" placeholder="https://..." />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Duration (Optional)</label>
 <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-white outline-none focus:" placeholder="24:00" />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Short Description</label>
 <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 text-white outline-none focus: resize-none" placeholder="What happens in this episode?" />
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Publishing Status</label>
 <select value={formData.status || 'published'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#111] p-3 text-white outline-none focus: appearance-none">
 <option value="published">Publish Instantly</option>
 <option value="queued">Queue for Later (Requires Schedule)</option>
 </select>
 </div>

 <button type="submit" className="w-full bg-primary text-background font-medium py-4 hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-md transition-colors uppercase text-micro">
 Save Episode
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

const AdForm = ({ id, label, initialData }) => {
 const [imageUrl, setImageUrl] = useState(initialData?.image || '');
 const [uploading, setUploading] = useState(false);
 const [isHidden, setIsHidden] = useState(initialData?.hidden || false);

 useEffect(() => {
 if (initialData) {
 setImageUrl(initialData.image || '');
 setIsHidden(initialData.hidden || false);
 }
 }, [initialData]);

 const handleUpload = async (e) => {
 const file = e.target.files[0];
 if (!file) return;
 setUploading(true);
 try {
 const storageRef = ref(storage, `ads/${Date.now()}_${file.name}`);
 const snapshot = await uploadBytes(storageRef, file);
 const url = await getDownloadURL(snapshot.ref);
 setImageUrl(url);
 toast.success("Image Uploaded");
 } catch (err) {
 toast.error("Upload Failed");
 } finally {
 setUploading(false);
 }
 };

 const handleReset = async () => {
 if (window.confirm("Restore factory default campaign?")) {
 await deleteDoc(doc(db, 'siteConfig', id));
 setImageUrl('');
 setIsHidden(false);
 toast.success("Default Restored");
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 const data = { 
 image: imageUrl, 
 buttonText: e.target.buttonText.value, 
 buttonLink: e.target.buttonLink.value,
 hidden: isHidden
 };
 await setDoc(doc(db, 'siteConfig', id), data);
 toast.success("Campaign Synchronized");
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-12 pt-16">
 <div className="flex justify-between items-center">
 <div className="space-y-1">
 <p className="text-[10px] font-medium text-white uppercase">{label}</p>
 <h3 className="text-h4 font-medium text-white">Ad Placement Settings</h3>
 </div>
 <div className="flex items-center gap-6">
 <label className="flex items-center gap-3 cursor-pointer group">
 <input 
 type="checkbox" 
 checked={isHidden} 
 onChange={async (e) => {
 const newVal = e.target.checked;
 setIsHidden(newVal);
 try {
 await setDoc(doc(db, 'siteConfig', id), { hidden: newVal }, { merge: true });
 toast.success(newVal ?"Ad Hidden" :"Ad Activated");
 } catch(err) {
 toast.error("Failed to update status");
 }
 }}
 className="hidden" 
 />
 <div className={`w-10 h-5 flex items-center p-1 transition-all ${isHidden ? 'bg-white/5 backdrop-blur-md rounded-xl border border-white/10 ' : 'bg-white/10 backdrop-blur-md rounded-xl '}`}>
 <div className={`w-2.5 h-2.5 transition-all ${isHidden ? 'bg-white/40 ml-5' : 'bg-white'}`} />
 </div>
 <span className={`text-[10px] font-medium transition-all ${isHidden ? 'text-white' : 'text-white'}`}>
 {isHidden ? 'HIDDEN' : 'ACTIVE'}
 </span>
 </label>
 <button type="button" 
 onClick={handleReset}
 className="text-[10px] font-medium text-white hover:text-white transition-all rounded-xl"
 >
 RESET DEFAULT
 </button>
 </div>
 </div>

 <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500 ${isHidden ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Ad Image</p>
 <div 
 onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = handleUpload; i.click(); }} 
 className="group relative w-full h-[280px] bg-white/[0.03] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.05] hover: transition-all overflow-hidden"
 >
 {imageUrl ? (
 <img loading="lazy" src={imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
 ) : (
 <div className="flex flex-col items-center gap-3">
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40"><path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
 <span className="text-[10px] font-medium text-white uppercase">{uploading ? 'Syncing...' : 'Upload Campaign Image'}</span>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-8 flex flex-col justify-end">
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Button Link Destination</p>
 <div className="bg-white/[0.03] p-6">
 <input name="buttonLink"
 defaultValue={initialData?.buttonLink || ''}
 list="site-routes"
 className="w-full bg-transparent border-none text-body font-medium text-white outline-none placeholder:text-white rounded-xl" 
 placeholder="/anime/..."
 />
 </div>
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-medium text-white uppercase">Button Text</p>
 <div className="bg-white/[0.03] p-6">
 <input name="buttonText"
 defaultValue={initialData?.buttonText || 'WATCH NOW'}
 className="w-full bg-transparent border-none text-body font-medium text-white outline-none placeholder:text-white uppercase rounded-xl" 
 placeholder="WATCH NOW"
 />
 </div>
 </div>
 <button type="submit" disabled={uploading} className="w-full bg-[#86E95C] text-black font-medium py-4 hover:bg-[#86E95C]/80 transition-colors uppercase text-micro disabled:opacity-50 mt-auto rounded-xl">
 {uploading ? 'SYNCHRONIZING...' : 'SYNCHRONIZE CAMPAIGN'}
 </button>
 </div>
 </div>
 
 <datalist id="site-routes">
 <option value="/" />
 <option value="/browse" />
 <option value="/community" />
 <option value="/reels" />
 </datalist>
 </form>
 );
};

const ReelModerator = ({ reelsList, onRefresh }) => {
 const { user } = useAuth();
 const [selectedReel, setSelectedReel] = useState(null);
 const [banDuration, setBanDuration] = useState('none');
 const [premadeMessage, setPremadeMessage] = useState('Your reel was removed due to a community guidelines violation.');
 const [modComment, setModComment] = useState('');
 const [viewingCommentsReel, setViewingCommentsReel] = useState(null);
 const [reelComments, setReelComments] = useState([]);

 const fetchComments = async (reelId) => {
 try {
 const q = query(collection(db, 'reels', reelId, 'comments'), orderBy('createdAt', 'desc'), limit(100));
 const snap = await getDocs(q);
 const fetchedComments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
 setReelComments(fetchedComments);
 
 const currentReel = reelsList.find(r => r.id === reelId);
 if (currentReel && currentReel.comments !== fetchedComments.length) {
 await updateDoc(doc(db, 'reels', reelId), { comments: fetchedComments.length });
 if (onRefresh) onRefresh();
 }
 } catch (err) {
 console.error(err);
 }
 };

 const handleOpenComments = (reel) => {
 setViewingCommentsReel(reel);
 fetchComments(reel.id);
 };

 const handleDeleteComment = async (commentId) => {
 if(!window.confirm('Delete this comment?')) return;
 try {
 await deleteDoc(doc(db, 'reels', viewingCommentsReel.id, 'comments', commentId));
 await updateDoc(doc(db, 'reels', viewingCommentsReel.id), { comments: increment(-1) });
 
 // Update local UI immediately
 setReelsList(prev => prev.map(r => r.id === viewingCommentsReel.id ? { ...r, comments: Math.max(0, (r.comments || 0) - 1) } : r));
 setViewingCommentsReel(prev => ({ ...prev, comments: Math.max(0, (prev.comments || 0) - 1) }));

 toast.success('Comment deleted');
 fetchComments(viewingCommentsReel.id);
 } catch (err) {
 toast.error('Failed to delete comment');
 }
 };

 const handleDismissReports = async (reelId) => {
 try {
 await updateDoc(doc(db, 'reels', reelId), {
 reportCount: 0,
 moderationStatus: 'addressed'
 });
 toast.success("Reports dismissed and marked as addressed.");
 if (onRefresh) onRefresh();
 } catch (err) {
 toast.error("Failed to dismiss reports");
 }
 };

 const PREMADE_MESSAGES = ["Your reel was removed due to a community guidelines violation.","NSFW content is strictly prohibited on NeonToad.","This content has been reported as spam or misleading.","Copyright violation detected. This media has been removed.",
 ];

 const handleModerate = async () => {
 if (!selectedReel) return;
 
 try {
 // 1. Delete the reel
 await deleteDoc(doc(db, 'reels', selectedReel.id));
 
 // 2. Notify User about the deletion
 await setDoc(doc(collection(db, 'notifications')), {
 recipientId: selectedReel.userId,
 actorName: 'System Moderator',
 message: `Your reel"${selectedReel.title}" was removed. Reason: ${premadeMessage}`,
 actorAvatar: 'https://i.pravatar.cc/150?u=admin',
 createdAt: serverTimestamp(),
 targetPath: '/profile',
 readBy: []
 });

 // 3. Handle Ban Duration
 if (banDuration !== 'none') {
 let banUntil = null;
 if (banDuration === '1day') {
 banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
 } else if (banDuration === '1week') {
 banUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
 } else if (banDuration === 'permanent') {
 banUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
 }

 await updateDoc(doc(db, 'users', selectedReel.userId), {
 isBanned: true,
 bannedUntil: banUntil,
 banReason: premadeMessage
 });
 toast.success(`User banned for ${banDuration}`);
 }

 toast.success("Reel successfully removed.");
 setSelectedReel(null);
 if(onRefresh) onRefresh();
 } catch (err) {
 toast.error("Failed to execute moderation action.");
 console.error(err);
 }
 };

 const handlePostModComment = async (reelId) => {
 if(!modComment.trim()) return;
 try {
 await setDoc(doc(collection(db, 'reels', reelId, 'comments')), {
 text: modComment,
 userId: user?.uid || 'admin',
 userName: user?.displayName || 'Admin Moderator',
 userAvatar: user?.photoURL || 'https://ui-avatars.com/api/?name=Admin&background=86E95C&color=000',
 createdAt: serverTimestamp(),
 isMod: true // Tag it as official
 });
 // Increment comment count
 await updateDoc(doc(db, 'reels', reelId), {
 comments: increment(1)
 });
 toast.success("Official MOD Comment posted.");
 setModComment('');
 if(onRefresh) onRefresh();
 } catch (err) {
 console.error(err);
 toast.error("Failed to post comment.");
 }
 };

 return (
 <div className="space-y-12">
 <div className="bg-white/[0.02] rounded-xl overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-white/5 text-[10px] font-medium text-white uppercase">
 <th className="p-4 pl-6">Creator & Reel</th>
 <th className="p-4 text-center">Likes</th>
 <th className="p-4 text-center">Comments</th>
 <th className="p-4 text-center">Reports</th>
 <th className="p-4 text-center">Views</th>
 <th className="p-4 pr-6 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {reelsList?.length === 0 ? (
 <tr><td colSpan="6" className="p-8 text-center text-white text-micro font-medium">No active reels to moderate.</td></tr>
 ) : reelsList?.map(reel => (
 <tr key={reel.id} className="group hover:bg-white/[0.05] transition-colors">
 <td className="p-4 pl-6">
 <div className="flex items-center gap-4">
 <img loading="lazy" src={reel.userAvatar ||"https://i.pravatar.cc/150"} alt="" className="w-10 h-10 object-cover rounded-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="min-w-0 max-w-[250px]">
 <p className="text-micro font-medium text-white truncate">@{reel.userName}</p>
 <p className="text-[11px] text-white truncate mt-0.5" title={reel.caption || reel.animeTitle}>{reel.caption || reel.animeTitle || 'Untitled Reel'}</p>
 </div>
 </div>
 </td>
 <td className="p-4 text-center text-micro text-white font-medium">{reel.likes || 0}</td>
 <td className="p-4 text-center text-micro text-white font-medium">{reel.comments || 0}</td>
 <td className="p-4 text-center">
 {reel.reportCount > 0 ? (
 <span className="text-micro font-medium text-white">{reel.reportCount}</span>
 ) : reel.moderationStatus === 'addressed' ? (
 <span className="text-[10px] bg-white/10 backdrop-blur-md rounded-xl text-white px-2 py-1 rounded-xl font-medium uppercase">Checked</span>
 ) : (
 <span className="text-micro font-medium text-white">0</span>
 )}
 </td>
 <td className="p-4 text-center text-micro text-white font-medium">{reel.views || 0}</td>
 <td className="p-4 pr-6 text-right">
 <div className="flex items-center justify-end gap-3 opacity-50 group-hover:opacity-100 transition-all">
 {reel.reportCount > 0 && (
 <button onClick={() => handleDismissReports(reel.id)} className="text-[10px] font-medium uppercase text-white hover:text-white transition-colors bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl px-4 py-2.5 hover:">Dismiss</button>
 )}
 <button onClick={() => handleOpenComments(reel)} className="text-[10px] font-medium uppercase text-white hover:text-white transition-colors bg-white/5 backdrop-blur-md rounded-xl border border-white/10 px-4 py-2.5 hover:">Comments</button>
 <button onClick={() => setSelectedReel(reel)} className="text-[10px] font-medium uppercase text-white hover:text-white transition-colors bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl px-4 py-2.5 hover:">Moderate</button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Moderation Modal */}
 <AnimatePresence>
 {selectedReel && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6 font-sans">
 <div className="w-full max-w-5xl glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 backdrop-blur-3xl p-0 flex flex-col md:flex-row max-h-[90vh] shadow-2xl">
 
 {/* Video Preview Side */}
 <div className="md:w-[40%] bg-transparent flex items-center justify-center relative overflow-hidden min-h-[400px]">
 <video src={selectedReel.url} className="w-full h-full object-contain" controls autoPlay loop />
 <div className="absolute top-4 left-4 bg-neutral-900/80 px-3 py-1.5 text-micro font-medium text-white shadow-lg">
 @{selectedReel.userName}
 </div>
 </div>

 {/* Controls Side */}
 <div className="md:w-[60%] p-8 md:p-12 space-y-8 overflow-y-auto flex flex-col justify-between">
 <div>
 <h3 className="text-h3 font-medium text-white mb-2">Moderate Reel</h3>
 <p className="text-micro text-white">Target: @{selectedReel.userName} -"{selectedReel.title}"</p>
 <p className="text-[12px] text-white mt-4 leading-relaxed line-clamp-3 italic">"{selectedReel.description}"</p>
 </div>

 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Select Warning Message</label>
 <select 
 value={premadeMessage} 
 onChange={e => setPremadeMessage(e.target.value)}
 className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-micro text-white outline-none focus: appearance-none"
 >
 {PREMADE_MESSAGES.map((msg, i) => (
 <option key={i} value={msg} className="bg-transparent text-white">{msg}</option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Custom Message (Optional)</label>
 <input 
 type="text" 
 value={premadeMessage}
 onChange={e => setPremadeMessage(e.target.value)}
 className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-micro text-white outline-none focus:"
 />
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-medium text-white uppercase">Ban User Duration</label>
 <select 
 value={banDuration} 
 onChange={e => setBanDuration(e.target.value)}
 className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-micro text-white outline-none focus: appearance-none"
 >
 <option value="none" className="bg-transparent text-white">No Ban (Just Delete Reel)</option>
 <option value="1day" className="bg-transparent text-white">1 Day Ban</option>
 <option value="1week" className="bg-transparent text-white">1 Week Ban</option>
 <option value="permanent" className="bg-transparent text-white">Permanent Ban</option>
 </select>
 </div>

 <div className="flex gap-4 pt-4">
 <button onClick={() => setSelectedReel(null)} className="flex-1 py-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 shadow-xl text-white text-micro font-medium uppercase transition-all">Cancel</button>
 <button onClick={handleModerate} className="flex-1 py-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white text-micro font-medium uppercase hover:bg-white/10 shadow-xl hover:text-white hover: transition-all">Confirm Moderation</button>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {viewingCommentsReel && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6 font-sans">
 <div className="w-full max-w-2xl max-h-[80vh] flex flex-col glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 backdrop-blur-3xl">
 <div className="p-6 flex justify-between items-center bg-white/5">
 <div>
 <h3 className="text-h4 font-medium text-white">Reel Comments</h3>
 <p className="text-[10px] text-white uppercase mt-1">Target: @{viewingCommentsReel.userName}</p>
 </div>
 <button onClick={() => setViewingCommentsReel(null)} className="text-white hover:text-white transition-colors">
 <BoxyX size={24} />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-6 space-y-4">
 {reelComments.length === 0 ? (
 <p className="text-white text-micro text-center py-8">No comments on this reel.</p>
 ) : reelComments.map(comment => (
 <div key={comment.id} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 flex gap-4 group">
 <img loading="lazy" src={comment.userAvatar} alt="User" className="w-10 h-10 object-cover rounded-full" />
 <div className="flex-1">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-micro font-medium text-white flex items-center gap-2">
 {comment.userName}
 {comment.isMod && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-xl uppercase">MOD</span>}
 </p>
 <p className="text-[10px] text-white">{comment.createdAt?.toDate().toLocaleString()}</p>
 </div>
 <button 
 onClick={() => handleDeleteComment(comment.id)}
 className="opacity-0 group-hover:opacity-100 text-white hover:text-white transition-all p-2"
 title="Delete Comment"
 >
 <BoxyX size={16} />
 </button>
 </div>
 <p className="text-micro text-white mt-2">{comment.text}</p>
 </div>
 </div>
 ))}
 </div>
 
 {/* Quick Mod Comment inside Modal */}
 <div className="p-4 bg-white/5 flex gap-4">
 <input 
 type="text" 
 value={modComment} 
 onChange={e => setModComment(e.target.value)} 
 placeholder="Post an official Warning or MOD note..." 
 className="flex-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 px-4 py-3 text-micro text-white outline-none focus:" 
 onKeyDown={e => e.key === 'Enter' && handlePostModComment(viewingCommentsReel.id)}
 />
 <button 
 onClick={() => handlePostModComment(viewingCommentsReel.id)} 
 className="bg-blue-500/20 text-blue-500 px-6 text-micro font-medium uppercase hover:bg-blue-500 hover:text-white transition-all border-blue-500/20"
 >
 POST AS MOD
 </button>
 </div>

 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default Admin;
