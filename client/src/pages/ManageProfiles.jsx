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
 className="text-[40px] md:text-[56px] font-medium text-white"
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
 <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden ring-2 ring-transparent ring-offset-2 ring-offset-background group-hover:ring-white/80 transition-all duration-300">
 <img loading="lazy"
 src={profile.avatarUrl || DEFAULT_AVATAR}
 alt={profile.name}
 className="w-full h-full object-cover transition-opacity"
 />
 <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
 <div className="p-3 rounded-xl group-hover: transition-colors bg-white/5 backdrop-blur-md">
 <BoxyEdit size={20} className="text-white" />
 </div>
 </div>
 </div>
 <span className="text-white group-hover:text-white text-body font-semibold transition-colors mt-2">
 {profile.name}
 </span>
 </div>
 ))}

 {profiles.length < 5 && (
 <Link to="/profiles/create" className="flex flex-col items-center gap-5 group">
 <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl flex items-center justify-center transition-all group-hover:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 border-2 group-hover:ring-white/80">
 <BoxyPlus size={64} className="text-white group-hover:text-white transition-colors" />
 </div>
 <span className="text-white group-hover:text-white text-body font-semibold transition-colors mt-2">
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
 className="bg-white text-black px-8 py-2 font-medium hover:bg-white/90 transition-all text-sm tracking-wide uppercase rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
 >
 Finish Configuration
 </button>
 </motion.div>
 </div>
 );
};

export default ManageProfiles;
