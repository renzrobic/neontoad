import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { BoxyChevron } from '../components/ui/BoxyIcons';
import { Helmet } from 'react-helmet-async';

const NewsDetail = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const [article, setArticle] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchArticle = async () => {
 try {
 const docRef = doc(db, 'news', id);
 const docSnap = await getDoc(docRef);
 if (docSnap.exists()) {
 setArticle({ id: docSnap.id, ...docSnap.data() });
 }
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };
 fetchArticle();
 window.scrollTo(0, 0);
 }, [id]);

 const formatDate = (timestamp) => {
 if (!timestamp) return"";
 if (timestamp.toDate) return timestamp.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
 return timestamp;
 };

 if (loading) return (
 <div className="min-h-screen bg-transparent flex items-center justify-center">
 <div style={{ borderRadius: '50%' }} className="w-12 h-12 border-4 border-t-white animate-spin" />
 </div>
 );

 if (!article) return (
 <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-6 p-10 text-center">
 <h1 className="text-h4 md:text-h3 font-medium text-white">Article not found</h1>
 <p className="text-white text-micro max-w-xs">The requested news article does not exist or has been removed from the core database.</p>
 <button onClick={() => navigate('/')} className="bg-white/90 text-background px-10 py-4 text-micro font-semibold hover:bg-white transition-all">Return home</button>
 </div>
 );

 return (
 <div className="bg-transparent min-h-screen pb-20 font-sans">
 <Helmet>
 <title>{`${article.title} | NeonToad`}</title>
 </Helmet>

 {/* Hero Header */}
 <div className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden">
 <img loading="lazy" src={article.image} className="w-full h-full object-cover object-top" alt="" />
 <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

 <div className="absolute inset-x-0 bottom-0 px-6 md:px-16 pb-12">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="max-w-4xl space-y-6"
 >
 <button
 onClick={() => navigate(-1)}
 className="flex items-center gap-3 text-white font-medium text-micro hover:text-white transition-colors mb-6"
 >
 <BoxyChevron direction="left" size={16} /> Back to feed
 </button>
 <div className="flex items-center gap-4">
 <span className="bg-white/10 backdrop-blur-md rounded-xl text-white px-3 py-1 text-[11px] font-medium">{article.category}</span>
 <span className="text-white text-micro font-medium">{formatDate(article.date)}</span>
 </div>
 <h1 className="text-h2 md:text-h1 font-semibold text-white leading-tight max-w-3xl">
 {article.title}
 </h1>
 </motion.div>
 </div>
 </div>

 {/* Article Body */}
 <div className="max-w-4xl mx-auto px-6 md:px-16 mt-16 md:mt-24">
 <div className="space-y-12">
 {/* Author Badge */}
 <div className="flex items-center gap-5 py-8 border-y">
 <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center flex-shrink-0">
 <span className="text-white font-semibold text-micro">NT</span>
 </div>
 <div>
 <p className="text-micro font-medium text-white">NeonToad editorial team</p>
 <p className="text-micro font-medium text-white">Verified industry source</p>
 </div>
 </div>

 {/* Content Rendering */}
 <div className="prose prose-invert prose-lg max-w-none">
 {/* Use dangerouslySetInnerHTML because we have rich text from admin */}
 <div
 dangerouslySetInnerHTML={{ __html: article.content }}
 className="article-content text-white text-h4 md:text-h4 leading-relaxed font-normal space-y-8 
 [&>p]:mb-8 
 [&>blockquote]:border-l-2 [&>blockquote]: [&>blockquote]:pl-8 [&>blockquote]:py-4 [&>blockquote]:my-12 [&>blockquote]:text-white [&>blockquote]:italic [&>blockquote]:bg-white/[0.04]
 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-4 [&>ul]:my-8
 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-4 [&>ol]:my-8
 [&>h1]:text-white [&>h1]:text-h2 [&>h1]:font-semibold [&>h1]:mt-16 [&>h1]:mb-8
 [&>h2]:text-white [&>h2]:text-h2 [&>h2]:font-semibold [&>h2]:mt-12 [&>h2]:mb-6
 [&>h3]:text-white [&>h3]:text-h3 [&>h3]:font-semibold [&>h3]:mt-10 [&>h3]:mb-4
 [&>img]:w-full [&>img]:aspect-video [&>img]:object-cover [&>img]: [&>img]: [&>img]:my-12 [&>img]:shadow-2xl [&>img]:shadow-white/5"
 />

 {/* Decorative Terminal Line */}
 <div className="py-16 flex items-center gap-4">
 <div className="flex-grow h-px bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="flex gap-2">
 {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-neutral-700 rounded-xl" />)}
 </div>
 <div className="flex-grow h-px bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>

 <p className="text-white text-micro leading-loose font-medium">
 Additional reporting and industry analysis for this story are being continuously updated in real-time. NeonToad remains committed to providing the fastest and most accurate anime news in the sector. All data is synchronized via the central database.
 </p>
 </div>

 {/* Footer Actions */}
 <div className="pt-20 flex flex-col md:flex-row justify-between items-center gap-10">
 <div className="text-center md:text-left space-y-3">
 <p className="text-[11px] font-medium text-white">LATEST NEWS</p>
 <div className="flex gap-6 justify-center md:justify-start">
 {['Twitter', 'Discord', 'Share'].map(link => (
 <button key={link} className="text-micro font-medium text-white hover:text-white transition-colors rounded-xl">{link}</button>
 ))}
 </div>
 </div>
 <button
 onClick={() => navigate('/')}
 className="w-full md:w-auto bg-white/5 backdrop-blur-md rounded-xl border border-white/10 px-12 py-5 text-micro font-semibold hover:bg-white/10 backdrop-blur-md rounded-xl transition-all"
 >
 Back to news
 </button>
 </div>
 </div>
 </div>
 </div>

 );
};

export default NewsDetail;
