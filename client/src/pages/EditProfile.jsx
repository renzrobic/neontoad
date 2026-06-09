import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BoxyEdit, BoxyCheck, BoxyX, BoxyChevron } from '../components/ui/BoxyIcons';
import { DEFAULT_AVATAR, getRandomToadAvatar, AVATAR_SERIES } from '../constants/avatars';
import SafeImage from '../components/ui/SafeImage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const EditProfile = () => {
 const { id } = useParams();
 const isEditing = !!id;
 const { profiles, addProfile, updateProfile, deleteProfile } = useAuth();
 const navigate = useNavigate();

 const [name, setName] = useState('');
 const [avatarUrl, setAvatarUrl] = useState(() => isEditing ? DEFAULT_AVATAR : getRandomToadAvatar());

 const [showAvatarPicker, setShowAvatarPicker] = useState(false);
 const [selectedSeries, setSelectedSeries] = useState(null);
 const [dbAvatarSeries, setDbAvatarSeries] = useState([]);

 useEffect(() => {
 const fetchAvatars = async () => {
 try {
 const snap = await getDocs(collection(db, 'avatars'));
 setDbAvatarSeries(snap.docs.map(d => ({id: d.id, ...d.data()})));
 } catch (err) {
 console.error(err);
 }
 };
 fetchAvatars();
 }, []);

 useEffect(() => {
 if (isEditing) {
 const profile = profiles.find(p => p.id === id);
 if (profile) {
 setName(profile.name);
 setAvatarUrl(profile.avatarUrl);
 }
 }
 }, [id, profiles, isEditing]);

 const handleSave = async () => {
 if (!name.trim()) return;

 try {
 if (isEditing) {
 await updateProfile(id, { name, avatarUrl });
 } else {
 await addProfile({ name, avatarUrl });
 }
 navigate('/profiles');
 } catch (err) {
 alert(err.message);
 }
 };

 const handleDelete = async () => {
 if (window.confirm('Delete this profile? All history will be lost.')) {
 await deleteProfile(id);
 navigate('/profiles');
 }
 };

 return (
 <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-sans">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full max-w-md glass-card bg-neutral-900 p-6 md:p-12 space-y-8 md:space-y-10"
 >
 <div className="space-y-2 text-center">
 <h1 className="text-[40px] md:text-[48px] font-bold text-white leading-none tracking-tighter">
 {isEditing ? 'Modify profile' : 'Create profile'}
 </h1>
 <p className="text-body text-white/90 font-medium tracking-tight">Name your hero.</p>
 </div>

 <div className="flex flex-col items-center gap-10">
 <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
 <div className="w-28 h-28 md:w-32 md:h-32 rounded-none overflow-hidden group-hover: transition-all">
 <SafeImage src={avatarUrl} alt="Selected Avatar" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <p className="text-micro font-medium text-white">Change</p>
 </div>
 </div>
 </div>

 <div className="w-full space-y-6">
 <div className="space-y-2">
 <label className="text-body font-semibold text-white/90 ml-1 tracking-tight">Profile name</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full h-12 md:h-14 bg-black/40 backdrop-blur-2xl rounded-none px-4 text-white font-medium focus: transition-all placeholder:text-white/90 text-body shadow-2xl outline-none"
 />
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <button
 onClick={handleSave}
 className="w-full min-h-[48px] md:min-h-[56px] px-6 py-3 bg-white text-black rounded-none font-bold text-body hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
 >
 {isEditing ? 'Update profile' : 'Create profile'}
 </button>
 <button
 onClick={() => navigate('/profiles')}
 className="w-full min-h-[48px] md:min-h-[56px] px-6 py-3 text-white/90 rounded-none font-semibold text-body hover:text-white hover: hover:bg-neutral-900 transition-all"
 >
 Cancel
 </button>
 {isEditing && (
 <button
 onClick={handleDelete}
 className="mt-4 text-micro font-medium text-white/90 hover:text-white text-center transition-colors"
 >
 Delete profile sequence
 </button>
 )}
 </div>
 </motion.div>

 {/* Avatar Picker Modal */}
 <AnimatePresence>
 {showAvatarPicker && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex flex-col p-4 md:p-12 overflow-y-auto"
 >
 <div className="max-w-6xl mx-auto w-full">
 <div className="flex items-center justify-between mb-8 md:mb-10">
 <h2 className="text-h2 font-medium text-white/90 leading-tight tracking-tight">
 {selectedSeries ? `Pick a character: ${selectedSeries.name}` : 'Pick a series'}
 </h2>
 <button onClick={() => { setShowAvatarPicker(false); setSelectedSeries(null); }} className="min-h-[44px] px-4 rounded-none hover:bg-neutral-800 transition-colors flex items-center justify-center">
 <BoxyX size={20} className="text-white/90" />
 </button>
 </div>

 {!selectedSeries ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
 {dbAvatarSeries.map((series) => (
 <motion.div
 key={series.id}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => setSelectedSeries(series)}
 className="relative aspect-square bg-neutral-900 overflow-hidden rounded-none cursor-pointer group hover: transition-all"
 >
 <SafeImage src={series.characters[0].image} className="w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-all duration-700" />
 <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background to-transparent">
 <span className="text-body font-semibold text-white/90 group-hover:text-white transition-colors tracking-tight leading-tight">{series.name}</span>
 </div>
 </motion.div>
 ))}
 </div>
 ) : (
 <div className="space-y-8 md:space-y-12">
 <button
 onClick={() => setSelectedSeries(null)}
 className="flex items-center gap-2 text-white/90 text-body font-semibold hover:text-white transition-all py-2 tracking-tight"
 >
 <BoxyChevron direction="left" size={14} /> Back to series
 </button>
 <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
 {selectedSeries.characters.map((char) => (
 <motion.div
 key={char.id}
 whileHover={{ y: -5 }}
 whileTap={{ scale: 0.9 }}
 onClick={() => {
 setAvatarUrl(char.image);
 setShowAvatarPicker(false);
 setSelectedSeries(null);
 }}
 className="flex flex-col items-center gap-3 cursor-pointer group"
 >
 <div className="w-full aspect-square bg-neutral-900 overflow-hidden rounded-none group-hover: transition-all shadow-2xl">
 <SafeImage src={char.image} className="w-full h-full object-cover" />
 </div>
 <span className="text-body mt-1 text-center font-semibold text-white/90 group-hover:text-white transition-colors leading-tight line-clamp-1 tracking-tight">{char.name}</span>
 </motion.div>
 ))}
 </div>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default EditProfile;
