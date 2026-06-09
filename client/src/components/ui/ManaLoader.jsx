import React from 'react';
import { motion } from 'framer-motion';

const ManaLoader = ({ size ="medium", label ="Gathering Mana" }) => {
 const sizeClasses = {
 small:"w-8 h-8",
 medium:"w-16 h-16",
 large:"w-24 h-24"
 };

 return (
 <div className="flex flex-col items-center justify-center gap-8">
 <div className={`relative ${sizeClasses[size]}`}>
 {/* Simple, Recognizable Mana Orb */}
 <motion.div
 animate={{
 scale: [1, 1.2, 1],
 opacity: [0.5, 1, 0.5],
 boxShadow: ["0 0 20px rgba(134, 233, 92, 0.4)","0 0 60px rgba(134, 233, 92, 0.8)","0 0 20px rgba(134, 233, 92, 0.4)"
 ]
 }}
 transition={{
 duration: 1.5,
 repeat: Infinity,
 ease:"easeInOut"
 }}
 className="absolute inset-0 bg-primary organic z-10"
 />

 {/* Subtle Outer Pulse */}
 <motion.div
 animate={{
 scale: [1, 1.6, 1],
 opacity: [0.2, 0, 0.2],
 }}
 transition={{
 duration: 1.5,
 repeat: Infinity,
 ease:"easeInOut"
 }}
 className="absolute inset-0 bg-primary/30 organic z-0"
 />
 </div>

 {label && (
 <motion.p
 animate={{ opacity: [0.4, 1, 0.4] }}
 transition={{ duration: 1.5, repeat: Infinity }}
 className="text-primary font-mideum text-[10px] text-center"
 >
 {label}
 </motion.p>
 )}
 </div>
 );
};

export default ManaLoader;
