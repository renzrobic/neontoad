import React from 'react';
import { useAuth } from '../context/AuthContext';
import AnimeCard from '../components/anime/AnimeCard';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { BoxyBookmark } from '../components/ui/BoxyIcons';

const MyList = () => {
 const { activeProfile } = useAuth();
 const favorites = activeProfile?.favorites || [];

 return (
 <div className="pt-24 min-h-screen bg-transparent px-6 md:px-16 pb-20">
 <Helmet>
 <title>My List | NeonToad</title>
 <meta name="description" content="Your saved anime list." />
 </Helmet>
 
 <div className="mb-6">
 <h1 className="text-h3 md:text-h2 font-medium text-white mb-4">My List</h1>
 </div>

 {favorites.length > 0 ? (
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 <AnimatePresence mode="popLayout">
 {favorites.map((anime) => (
 <motion.div
 key={anime.id}
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 transition={{ duration: 0.2 }}
 >
 <AnimeCard anime={anime} />
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-32 text-white gap-6">
 <BoxyBookmark size={80} className="opacity-20" />
 <div className="text-center">
 <h2 className="text-h3 font-medium text-white mb-2">Your list is empty</h2>
 <p className="text-micro font-medium max-w-xs mx-auto">Save shows and movies to keep track of what you want to watch.</p>
 </div>
 </div>
 )}
 </div>
 );
};

export default MyList;
