import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BoxyPlus, BoxyEdit } from '../components/ui/BoxyIcons';
import SkeletonProfile from '../components/SkeletonProfile';
import { DEFAULT_AVATAR } from '../constants/avatars';
import SafeImage from '../components/ui/SafeImage';

const Profiles = () => {
 const { profiles, selectProfile, user, loading } = useAuth();
 const navigate = useNavigate();

 React.useEffect(() => {
 // Wait for everything to be ready
 if (loading || profiles === null || !user) return;

 console.log("Profile Sync Check:", { profilesCount: profiles.length, loading, userId: user?.uid });

 if (profiles.length === 0) {
 console.log("No profiles found, redirecting to creation...");
 navigate('/profiles/create');
 }
 }, [profiles, loading, user, navigate]);

 const handleSelect = (profile) => {
 selectProfile(profile);
 navigate('/');
 };

 return (
 <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 font-sans">
 <div className="text-center mb-20 space-y-2">
 <motion.h1
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-[40px] md:text-[56px] font-bold text-white tracking-tighter"
 >
 Who's watching?
 </motion.h1>
 </div>

 <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 max-w-5xl">
 {loading ? (
 [...Array(3)].map((_, i) => (
 <SkeletonProfile key={i} />
 ))
 ) : (
 <>
 {profiles.map((profile) => (
 <motion.div
 key={profile.id}
 whileHover={{ y: -5 }}
 className="flex flex-col items-center gap-5 group cursor-pointer"
 onClick={() => handleSelect(profile)}
 >
 <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-none overflow-hidden border-2 border-transparent group-hover:border-white transition-all duration-300">
 <SafeImage
 src={profile.avatarUrl || DEFAULT_AVATAR}
 alt={profile.name}
 className="w-full h-full object-cover"
 />
 </div>
 <span className="text-white/90 group-hover:text-white text-body font-semibold transition-colors tracking-tight mt-2">
 {profile.name}
 </span>
 </motion.div>
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
 </>
 )}
 </div>

 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.5 }}
 className="mt-24"
 >
 <Link
 to="/profiles/manage"
 className="text-white/90 hover:text-white px-6 py-2 hover:border-white font-semibold transition-all tracking-wide uppercase text-sm"
 >
 Manage Profiles
 </Link>
 </motion.div>
 </div>
 );
};

export default Profiles;
