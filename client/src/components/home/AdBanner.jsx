import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { AdSkeleton } from '../skeletons/SectionSkeletons';
import React from 'react';

const AdBanner = React.memo(({ id = 'ad1' }) => {
 const [adData, setAdData] = useState(null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 useEffect(() => {
 const unsub = onSnapshot(doc(db, 'siteConfig', id), (doc) => {
 if (doc.exists()) {
 setAdData(doc.data());
 } else {
 setAdData({
 buttonText: 'Start 30-day free trial',
 buttonLink: '/premium',
 image:"/src/assets/images/premium-ad.png"
 });
 }
 setLoading(false);
 });
 return () => unsub();
 }, [id]);

 if (loading) return <AdSkeleton />;
 if (adData?.hidden) return null;

 const handleButtonClick = (e) => {
 const link = adData.buttonLink || '#';
 if (link.startsWith('/') && !link.startsWith('//')) {
 e.preventDefault();
 navigate(link);
 }
 };

 return (
 <div className="px-6 md:px-16 mb-10 md:mb-16">
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6 }}
 className="relative w-full h-[250px] md:h-[300px] overflow-hidden group cursor-pointer glass-card"
 >
 {adData.image && (
 <img loading="lazy" 
 src={adData.image} 
 alt="" 
 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
 onError={(e) => {
 e.target.style.display = 'none';
 }}
 />
 )}
 
 {/* Dark gradient at the bottom to ensure the button is always readable against any image */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12 z-20">
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 whileInView={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.2 }}
 className="space-y-4 max-w-xl"
 >
 {adData.title && (
 <h3 className="text-h3 md:text-h2 font-medium text-white leading-none shadow-black drop-shadow-lg">
 {adData.title}
 </h3>
 )}
 {adData.description && (
 <p className="text-micro md:text-body text-white shadow-black drop-shadow-md">
 {adData.description}
 </p>
 )}
 
 <a 
 href={adData.buttonLink || '#'} 
 onClick={handleButtonClick}
 target={adData.buttonLink?.startsWith('/') ? undefined :"_blank"}
 rel="noopener noreferrer"
 className="inline-flex bg-white text-black px-10 py-3.5 md:px-12 md:py-4 text-micro font-medium hover:bg-white/90 transition-all shadow-xl uppercase items-center"
 >
 {adData.buttonText ||"WATCH NOW"}
 </a>
 </motion.div>
 </div>
 </motion.div>
 </div>
 );
});

export default AdBanner;
