import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, getDoc, doc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ReleaseCalendar = () => {
 const [schedules, setSchedules] = useState([]);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 useEffect(() => {
 const fetchSchedules = async () => {
 try {
 const q = query(collection(db, 'schedules'));
 const epQ = query(collection(db, 'episodes'), where('status', '==', 'queued'));
 
 const [snapshot, epSnap] = await Promise.all([getDocs(q), getDocs(epQ)]);
 
 // Collect all unique animeIds
 const uniqueAnimeIds = new Set();
 snapshot.docs.forEach(d => { if (d.data().animeId) uniqueAnimeIds.add(String(d.data().animeId)); });
 epSnap.docs.forEach(d => {
 const data = d.data();
 if (data.status === 'queued' && data.releaseDate && data.releaseDate.toDate() >= new Date() && data.animeId) {
 uniqueAnimeIds.add(String(data.animeId));
 }
 });

 // Fetch all anime concurrently
 const animeMap = new Map();
 if (uniqueAnimeIds.size > 0) {
 const animePromises = Array.from(uniqueAnimeIds).map(id => getDoc(doc(db, 'anime', id)));
 const animeDocs = await Promise.all(animePromises);
 animeDocs.forEach(d => {
 if (d.exists()) {
 animeMap.set(d.id, d.data());
 }
 });
 }

 const scheduleData = [];
 const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 
 for (const d of snapshot.docs) {
 const data = d.data();
 let animeImage = '';
 
 if (data.animeId && animeMap.has(String(data.animeId))) {
 animeImage = animeMap.get(String(data.animeId)).image;
 }

 let nextDate = new Date();
 if (data.dayOfWeek) {
 const targetDay = daysOfWeek.indexOf(data.dayOfWeek);
 const currentDay = nextDate.getDay();
 let distance = targetDay - currentDay;
 if (distance < 0) distance += 7;
 
 // If it's today, check if time has passed
 if (distance === 0 && data.time) {
 const [hours, minutes] = data.time.split(':');
 const scheduleTime = new Date();
 scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
 if (new Date() > scheduleTime) {
 distance += 7; // Next week
 }
 }
 
 nextDate.setDate(nextDate.getDate() + distance);
 if (data.time) {
 const [hours, minutes] = data.time.split(':');
 nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
 }
 } else if (data.date) {
 nextDate = new Date(data.date + 'T' + (data.time || '00:00'));
 }
 
 scheduleData.push({
 id: d.id,
 ...data,
 image: animeImage,
 calculatedDate: nextDate
 });
 }
 
 // Process queued episodes
 for (const ep of epSnap.docs) {
 const data = ep.data();
 if (data.releaseDate) {
 const releaseDate = data.releaseDate.toDate();
 if (releaseDate >= new Date()) {
 let animeImage = '';
 let animeTitle = '';
 if (data.animeId && animeMap.has(String(data.animeId))) {
 const aData = animeMap.get(String(data.animeId));
 animeImage = aData.image;
 animeTitle = aData.title;
 }
 scheduleData.push({
 id: ep.id,
 title: `S${data.season} E${data.episodeNumber}`,
 animeTitle: animeTitle,
 animeId: data.animeId,
 image: animeImage,
 calculatedDate: releaseDate,
 time: releaseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
 });
 }
 }
 }
 
 scheduleData.sort((a, b) => a.calculatedDate - b.calculatedDate);
 
 // Filter out past static dates
 const upcomingSchedules = scheduleData.filter(s => s.calculatedDate >= new Date() || s.dayOfWeek);

 setSchedules(upcomingSchedules.slice(0, 10));
 } catch (err) {
 console.error("Error fetching schedules:", err);
 } finally {
 setLoading(false);
 }
 };

 fetchSchedules();
 }, []);

 if (loading || schedules.length === 0) return null;

 return (
 <div className="px-4 md:px-16 pt-0 pb-10 md:pb-[72px] relative z-20">
 <h2 className="text-h4 md:text-h3 font-bold text-white mb-6 tracking-tight">Upcoming Releases</h2>
 
 <div className="relative">
 <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 scrollbar-hide snap-x">
 {schedules.map((schedule, idx) => {
 const scheduleDate = schedule.calculatedDate || new Date(schedule.date);
 const dayName = scheduleDate.toLocaleDateString('en-US', { weekday: 'short' });
 const monthDay = scheduleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
 
 return (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.1 }}
 key={schedule.id}
 onClick={() => schedule.animeId && navigate(`/anime/${schedule.animeId}`)}
 className={`min-w-[280px] md:min-w-[320px] bg-white/[0.02] p-4 rounded-none flex items-center gap-4 snap-start transition-all hover:bg-white/[0.05] ${schedule.animeId ? 'cursor-pointer' : ''}`}
 >
 <div className="flex flex-col items-center justify-center min-w-[60px] p-2 bg-neutral-900 rounded-none">
 <span className="text-[#86E95C] text-[10px] font-bold uppercase tracking-widest">{dayName}</span>
 <span className="text-white text-h4 font-black tracking-tighter">{monthDay.split(' ')[1]}</span>
 </div>
 
 {schedule.image && (
 <img loading="lazy" src={schedule.image} className="w-12 h-16 object-cover rounded-none shadow-lg" alt={schedule.animeTitle || schedule.title} />
 )}
 
 <div className="flex flex-col flex-1 overflow-hidden">
 <span className="text-white font-semibold text-micro truncate">{schedule.animeTitle || schedule.title}</span>
 <span className="text-white/90 text-[11px] font-medium tracking-tight mt-1">Releases at {schedule.time}</span>
 </div>
 </motion.div>
 );
 })}
 </div>
 {/* Right-fade scroll hint */}
 <div className="absolute top-0 right-0 bottom-6 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
 </div>
 </div>
 );
};

export default ReleaseCalendar;
