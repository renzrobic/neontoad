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
 className="text-[40px] md:text-[56px] font-medium text-white"
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
 <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden ring-2 ring-transparent group-hover:ring-white/80 ring-offset-4 ring-offset-background transition-all duration-300 shadow-2xl">
 <SafeImage
 src={profile.avatarUrl || DEFAULT_AVATAR}
 alt={profile.name}
 className="w-full h-full object-cover"
 />
 </div>
 <span className="text-white group-hover:text-white text-body font-semibold transition-colors mt-2">
 {profile.name}
 </span>
 </motion.div>
 ))}

 {profiles.length < 5 && (
 <Link to="/profiles/create" className="flex flex-col items-center gap-5 group">
 <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center transition-all bg-white/5 backdrop-blur-md ring-2 ring-white/10 group-hover:ring-white/80 ring-offset-4 ring-offset-background group-hover:bg-white/10 shadow-2xl">
 <BoxyPlus size={64} className="text-white group-hover:text-white group-hover:scale-110 transition-all duration-300" />
 </div>
 <span className="text-white group-hover:text-white text-body font-semibold transition-colors mt-2">
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
 className="text-white hover:text-white px-6 py-2 hover:border-white font-semibold transition-all tracking-wide uppercase text-sm"
 >
 Manage Profiles
 </Link>
 </motion.div>
 </div>
 );
};

export default Profiles;
