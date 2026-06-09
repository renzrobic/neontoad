import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BoxyPlus, BoxyEdit } from '../components/ui/BoxyIcons';
import { DEFAULT_AVATAR } from '../constants/avatars';

const ManageProfiles = () => {
 const { profiles } = useAuth();
 const navigate = useNavigate();

 return (
 <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 font-sans">
 <div className="text-center mb-20 space-y-4">
 <motion.h1
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-[40px] md:text-[56px] font-bold text-white tracking-tighter"
 >
 Manage profiles
 </motion.h1>
 </div>

 <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 max-w-5xl">
 {profiles.map((profile) => (
 <div
 key={profile.id}
 className="flex flex-col items-center gap-5 group cursor-pointer relative"
 onClick={() => navigate(`/profiles/edit/${profile.id}`)}
 >
 <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-none overflow-hidden border-2 border-transparent group-hover:border-white transition-all duration-300">
 <img loading="lazy"
 src={profile.avatarUrl || DEFAULT_AVATAR}
 alt={profile.name}
 className="w-full h-full object-cover transition-opacity"
 />
 <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
 <div className="p-3 rounded-none group-hover: transition-colors bg-black/40 backdrop-blur-md">
 <BoxyEdit size={20} className="text-white" />
 </div>
 </div>
 </div>
 <span className="text-white/90 group-hover:text-white text-body font-semibold transition-colors tracking-tight mt-2">
 {profile.name}
 </span>
 </div>
 ))}

 {profiles.length < 5 && (
 <Link to="/profiles/create" className="flex flex-col items-center gap-5 group">
 <div className="w-28 h-28 md:w-36 md:h-36 rounded-none flex items-center justify-center transition-all group-hover:bg-neutral-900 border-2 group-hover:border-white">
 <BoxyPlus size={64} className="text-white/90 group-hover:text-white transition-colors" />
 </div>
 <span className="text-white/90 group-hover:text-white text-body font-semibold transition-colors tracking-tight mt-2">
 Add Profile
 </span>
 </Link>
 )}
 </div>

 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.5 }}
 className="mt-24"
 >
 <button
 onClick={() => navigate('/profiles')}
 className="bg-white text-black px-8 py-2 font-bold hover:bg-white/90 transition-all text-sm tracking-wide uppercase rounded-none shadow-[0_0_20px_rgba(255,255,255,0.1)]"
 >
 Finish Configuration
 </button>
 </motion.div>
 </div>
 );
};

export default ManageProfiles;
