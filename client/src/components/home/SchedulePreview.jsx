import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

import React from 'react';

const SchedulePreview = React.memo(() => {
 const [schedule, setSchedule] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const q = query(collection(db, 'schedules'), orderBy('time'));
 const unsub = onSnapshot(q, (snap) => {
 const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 if (data.length > 0) {
 setSchedule(data);
 } else {
 setSchedule([
 { id: 'f1', time: '18:00', title: 'Solo Leveling', episode: 'Episode 12', status: 'LIVE NOW' },
 { id: 'f2', time: '20:30', title: 'One Piece', episode: 'Episode 1105', status: 'Coming Soon' },
 { id: 'f3', time: '21:00', title: 'Kaiju No. 8', episode: 'Episode 5', status: 'Coming Soon' },
 { id: 'f4', time: '23:15', title: 'Demon Slayer', episode: 'Hashira Training Arc', status: 'Coming Soon' }
 ]);
 }
 setLoading(false);
 });
 return () => unsub();
 }, []);

 if (loading) return (
 <div className="px-6 md:px-16 py-12 md:py-20 animate-pulse">
 <div className="h-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 w-48 mb-10" />
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />)}
 </div>
 </div>
 );

 return (
 <div className="px-6 md:px-16 py-12 md:py-20">
 <div className="flex items-center gap-4 mb-10">
 <div className="w-1.5 h-6 bg-white/10 backdrop-blur-md rounded-xl" />
 <h2 className="text-h2 md:text-h2 font-medium text-white">Today's schedule</h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {schedule.map((item, i) => (
 <motion.div
 key={item.id}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className="glass-card p-6 group"
 >
 <div className="flex justify-between items-start mb-4">
 <span className="text-white font-medium text-micro">{item.time}</span>
 {item.status === 'Live now' && (
 <span className="bg-white/10 backdrop-blur-md rounded-xl text-white text-[10px] font-medium px-2 py-0.5 animate-pulse">
 Live now
 </span>
 )}
 </div>
 <h3 className="text-h4 font-medium text-white group-hover:text-white transition-colors mb-1 truncate">
 {item.title}
 </h3>
 <p className="text-[11px] font-medium text-white">{item.episode}</p>

 <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <div className="w-full h-px bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <button className="flex-shrink-0 text-[10px] font-medium text-white hover:text-white transition-colors rounded-xl">Set reminder</button>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 );
});

export default SchedulePreview;
