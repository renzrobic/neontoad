import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { NewsSkeleton } from '../skeletons/SectionSkeletons';
import { useNavigate } from 'react-router-dom';
import { BoxyMessage } from '../ui/BoxyIcons';
const NewsSection = React.memo(() => {
 const [news, setNews] = useState([]);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 useEffect(() => {
 const q = query(collection(db, 'news'), orderBy('date', 'desc'), limit(15));
 const unsub = onSnapshot(q, (snap) => {
 const newsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setNews(newsData);
 setLoading(false);
 });
 return () => unsub();
 }, []);

 const formatDate = (timestamp) => {
 if (!timestamp) return"";
 if (timestamp.toDate) return timestamp.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
 return timestamp;
 };

 if (loading) return <NewsSkeleton />;

 if (news.length === 0) {
 return (
 <div className="px-6 md:px-16 py-12 md:py-20 bg-transparent">
 <div className="mb-12">
 <h2 className="text-h3 md:text-h1 font-semibold text-white/90 tracking-tighter">News</h2>
 <div className="h-4" />
 <p className="text-micro md:text-h4 font-medium text-white/90 tracking-tight">Stay updated with the latest in anime.</p>
 </div>
 <div className="py-24 flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-8">
 {/* Mascot Placeholder */}
 <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/10 flex-shrink-0 relative overflow-hidden group">
  <img 
  src="/images/mascots/toady-news.svg" 
  alt="Toady Mascot - News" 
  className="absolute inset-0 w-full h-full object-contain z-10 transition-opacity" 
  onError={(e) => e.target.style.opacity = 0}
  />
  <div className="text-white/30 text-center px-2 absolute inset-0 flex flex-col items-center justify-center -z-0">
  <BoxyMessage size={24} className="mx-auto mb-1 opacity-50" />
  <p className="text-[10px] font-bold tracking-widest uppercase text-balance">toady-news.svg</p>
  </div>
 </div>

 {/* Text Content */}
 <div className="flex flex-col items-center md:items-start max-w-sm">
 <h3 className="text-h4 md:text-h3 font-bold text-white/90 tracking-tight mb-2">All caught up!</h3>
 <p className="text-micro font-normal text-white/50 tracking-tight leading-relaxed">
 We're still gathering the latest news. Check back soon.
 </p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="px-6 md:px-16 pt-0 pb-10 md:pb-[72px] bg-transparent">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
 <div>
 <h2 className="text-h3 md:text-h1 font-semibold text-white/90 tracking-tighter leading-none">Breaking news</h2>
 </div>
 <button onClick={() => navigate('/library')} className="text-[13px] font-medium text-white/90 hover:text-white transition-all underline decoration-1 underline-offset-8 tracking-tight">
 View all
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6">
 {/* Featured News */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 onClick={() => navigate(`/news/${news[0]?.id}`)}
 className="lg:col-span-2 relative w-full h-[400px] md:h-[500px] lg:h-[600px] group overflow-hidden cursor-pointer glass-card"
 >
 <img loading="lazy" src={news[0]?.image} className="w-full h-full object-cover object-top transition-transform duration-700 opacity-70 group-hover:opacity-100" alt="" />
 <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent flex flex-col justify-end p-6 md:p-12 pointer-events-none">
 <h3 className="text-h3 md:text-h2 font-semibold text-white mb-4 leading-[1.1] transition-colors tracking-tight">
 {news[0]?.title}
 </h3>
 <p className="text-white/90 text-micro font-medium tracking-tight">{formatDate(news[0]?.date)}</p>
 </div>
 </motion.div>

 {/* List News */}
 <div className="flex flex-col h-[400px] md:h-[500px] lg:h-[600px]">
 <div className="flex-1 overflow-y-auto pr-2 md:pr-6 space-y-6 md:space-y-8 pb-6">
 {news.slice(1).map((item, i) => (
 <motion.div
 key={item.id}
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 onClick={() => navigate(`/news/${item.id}`)}
 className="flex gap-4 md:gap-6 group cursor-pointer"
 >
 <div className="w-28 md:w-36 aspect-video glass flex-shrink-0 overflow-hidden">
 <img loading="lazy" src={item.image} className="w-full h-full object-cover transition-transform duration-500 opacity-60 group-hover:opacity-100" alt="" />
 </div>
 <div className="flex flex-col justify-center gap-2 py-2">
 <h4 className="text-body md:text-h4 font-medium text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-tight tracking-tight">
 {item.title}
 </h4>
 <p className="text-white/90 text-[11px] font-medium mt-1">{formatDate(item.date)}</p>
 </div>
 </motion.div>
 ))}
 </div>

 <div className="pt-6 mt-auto flex-shrink-0">
 <div className="glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8 space-y-4 flex flex-col md:flex-row items-center justify-between gap-4">
 <div>
 <h5 className="text-h4 font-medium text-white tracking-tight mb-1">Join the community</h5>
 <p className="text-[12px] text-white/90 leading-relaxed font-medium max-w-sm">
 Get the latest anime news and seasonal previews.
 </p>
 </div>
 <button className="w-full md:w-auto px-8 py-3.5 bg-white text-black text-micro font-bold hover:bg-white/90 transition-all active:scale-95 tracking-tight whitespace-nowrap rounded-xl">
 Subscribe
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
});

export default NewsSection;
