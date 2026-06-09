import React, { useState, useEffect } from 'react';
import { BoxyClock, BoxyChevron, BoxyCalendar } from '../components/ui/BoxyIcons';
import { motion } from 'framer-motion';
import { collection, query, getDocs, getDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
 const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
 const [schedule, setSchedule] = useState({});
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 const dayThemes = {
 'Monday': { headerBg: 'glass', headerText: 'text-white/90', cardBg: 'glass-card', accent: 'text-white/90', border: '' },
 'Tuesday': { headerBg: 'glass', headerText: 'text-white/90', cardBg: 'glass-card', accent: 'text-white/90', border: '' },
 'Wednesday': { headerBg: 'glass', headerText: 'text-white/90', cardBg: 'glass-card', accent: 'text-white/90', border: '' },
 'Thursday': { headerBg: 'glass', headerText: 'text-white/90', cardBg: 'glass-card', accent: 'text-white/90', border: '' },
 'Friday': { headerBg: 'glass', headerText: 'text-white/90', cardBg: 'glass-card', accent: 'text-white/90', border: '' },
 'Saturday': { headerBg: 'glass', headerText: 'text-white/90', cardBg: 'glass-card', accent: 'text-white/90', border: '' },
 'Sunday': { headerBg: 'glass', headerText: 'text-white/90', cardBg: 'glass-card', accent: 'text-white/90', border: '' },
 };

 useEffect(() => {
 const fetchSchedule = async () => {
 try {
 const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

 const groupedSchedule = {
 'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [],
 'Friday': [], 'Saturday': [], 'Sunday': []
 };

 const q = query(collection(db, 'schedules'));
 const snapshot = await getDocs(q);

 for (const docSnap of snapshot.docs) {
 const data = docSnap.data();
 let day = data.dayOfWeek;
 if (!day && data.date) {
 day = daysOfWeek[new Date(data.date).getDay()];
 }
 if (day && groupedSchedule[day]) {
 let animeImage = '';
 let animeTitle = data.animeTitle || data.title;
 if (data.animeId) {
 const aDoc = await getDoc(doc(db, 'anime', String(data.animeId)));
 if (aDoc.exists()) {
 animeImage = aDoc.data().image;
 if (!animeTitle) animeTitle = aDoc.data().title;
 }
 }
 groupedSchedule[day].push({ 
 id: data.animeId || docSnap.id, 
 title: animeTitle, 
 image: animeImage,
 broadcastTime: data.time || '12:00'
 });
 }
 }

 const epQ = query(collection(db, 'episodes'), where('status', '==', 'queued'));
 const epSnap = await getDocs(epQ);
 for (const ep of epSnap.docs) {
 const data = ep.data();
 if (data.releaseDate) {
 const releaseDate = data.releaseDate.toDate();
 if (releaseDate >= new Date()) {
 const day = daysOfWeek[releaseDate.getDay()];
 if (groupedSchedule[day]) {
 let animeImage = '';
 let animeTitle = '';
 if (data.animeId) {
 const aDoc = await getDoc(doc(db, 'anime', String(data.animeId)));
 if (aDoc.exists()) {
 animeImage = aDoc.data().image;
 animeTitle = aDoc.data().title;
 }
 }
 groupedSchedule[day].push({
 id: data.animeId || ep.id,
 title: animeTitle,
 episodes: `S${data.season} E${data.episodeNumber}`,
 image: animeImage,
 broadcastTime: releaseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
 });
 }
 }
 }
 }

 // Sort by time within each day
 Object.keys(groupedSchedule).forEach(day => {
 groupedSchedule[day].sort((a, b) => a.broadcastTime.localeCompare(b.broadcastTime));
 });

 setSchedule(groupedSchedule);
 } catch (error) {
 console.error("Error fetching schedule:", error);
 } finally {
 setLoading(false);
 }
 };

 fetchSchedule();
 }, []);

 return (
 <div className="pt-24 min-h-screen bg-transparent px-4 md:px-16 pb-20">
 <div className="mb-12 flex items-end justify-between">
 <div className="space-y-2">
 <h1 className="text-h2 md:text-h1 font-semibold text-white flex items-center tracking-tight">
 Release Calendar
 </h1>
 <p className="text-white/90 font-medium text-body md:text-h4 tracking-tight">Never miss a beat of your favorite weekly episodes.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
 {days.map((day, idx) => {
 const theme = dayThemes[day];
 return (
 <motion.div
 key={day}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.1 }}
 className="flex flex-col gap-3"
 >
 <div className={`${theme.headerBg} ${theme.headerText} p-3 text-center font-medium text-micro transition-all cursor-default tracking-tight`}>
 {day}
 </div>
 <div className="flex flex-col gap-3">
 {schedule[day]?.map((anime, i) => (
 <div
 key={i}
 onClick={() => navigate(`/anime/${anime.id}`)}
 className={`${theme.cardBg} hover: overflow-hidden cursor-pointer group transition-all`}
 >
 <div className="h-28 relative overflow-hidden">
 <img loading="lazy" src={anime.image} className="w-full h-full object-cover transition-transform duration-700" alt="" />
 <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
 <div className="absolute top-2 right-2 bg-neutral-800 text-white backdrop-blur-md font-medium text-[10px] px-2 py-1 tracking-tight">
 New Episode
 </div>
 </div>
 <div className="p-3.5 space-y-2">
 <div className={`flex items-center gap-1.5 ${theme.accent} group-hover:text-white transition-colors`}>
 <BoxyClock size={12} />
 <span className="text-[11px] font-medium tracking-tight">{anime.broadcastTime || '12:00'}</span>
 </div>
 <h3 className="font-medium text-micro text-white/90 line-clamp-1 group-hover:text-white transition-colors tracking-tight">{anime.title}</h3>
 <div className="flex items-center justify-between pt-2">
 <span className="text-[10px] font-medium text-white/90 tracking-tight">{anime.episodes ? `EP ${anime.episodes.split(' ')[0]}` : 'Ongoing'}</span>
 <BoxyChevron size={12} className="text-white/90 group-hover:text-white transition-colors group-hover:translate-x-1" />
 </div>
 </div>
 </div>
 ))}
 {(!schedule[day] || schedule[day].length === 0) && (
 <div className={`flex flex-col items-center justify-center py-20 ${theme.cardBg}/20 text-white/5 group`}>
 <BoxyClock size={32} className="opacity-10 mb-2" />
 <span className="text-[10px] font-medium opacity-20 tracking-tight">Empty</span>
 </div>
 )}
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>
 );
};

export default Calendar;
