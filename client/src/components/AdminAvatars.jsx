import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { BoxyPlus, BoxyX, BoxyUser } from './ui/BoxyIcons';
import { AVATAR_SERIES } from '../constants/avatars';

const AdminAvatars = () => {
 const [seriesList, setSeriesList] = useState([]);
 const [loading, setLoading] = useState(true);
 const [editingSeries, setEditingSeries] = useState(null);

 const fetchAvatars = async () => {
 setLoading(true);
 try {
 const snap = await getDocs(collection(db, 'avatars'));
 
 if (snap.empty) {
 // Seed database with default AVATAR_SERIES if empty
 const batch = writeBatch(db);
 AVATAR_SERIES.forEach(series => {
 const docRef = doc(db, 'avatars', series.id);
 batch.set(docRef, series);
 });
 await batch.commit();
 
 // Refetch after seeding
 const seededSnap = await getDocs(collection(db, 'avatars'));
 const list = seededSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setSeriesList(list);
 } else {
 const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setSeriesList(list);
 }
 } catch (err) {
 toast.error('Failed to fetch avatars');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchAvatars();
 }, []);

 const handleSaveSeries = async () => {
 if (!editingSeries.id || !editingSeries.name) {
 return toast.error('ID and Name are required');
 }
 // Clean up empty characters before saving
 const cleanedSeries = {
 ...editingSeries,
 characters: editingSeries.characters.filter(c => c.id && c.name && c.image)
 };

 try {
 await setDoc(doc(db, 'avatars', cleanedSeries.id), cleanedSeries);
 toast.success('Avatar Series saved!');
 setEditingSeries(null);
 fetchAvatars();
 } catch (err) {
 console.error(err);
 toast.error('Failed to save series');
 }
 };

 const handleDeleteSeries = async (id) => {
 if (!window.confirm('Are you sure you want to delete this series?')) return;
 try {
 await deleteDoc(doc(db, 'avatars', id));
 toast.success('Series deleted');
 fetchAvatars();
 } catch (err) {
 console.error(err);
 toast.error('Failed to delete series');
 }
 };

 if (editingSeries) {
 return (
 <div className="space-y-12">
 <div className="flex justify-between items-center pb-8">
 <h2 className="text-h3 font-bold text-white tracking-tight">{editingSeries.id ? 'Edit Avatar Series' : 'New Avatar Series'}</h2>
 <button onClick={() => setEditingSeries(null)} className="text-white/90 hover:text-white transition-colors">
 Cancel
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <p className="text-[10px] font-bold text-white/90 tracking-widest uppercase">Series ID (e.g., 'naruto')</p>
 <input 
 type="text" 
 value={editingSeries.id} 
 onChange={e => setEditingSeries({...editingSeries, id: e.target.value})} 
 className="w-full bg-white/[0.03] p-4 text-white placeholder-white/20 focus:outline-none focus: transition-all"
 placeholder="Unique identifier"
 />
 </div>
 <div className="space-y-4">
 <p className="text-[10px] font-bold text-white/90 tracking-widest uppercase">Series Name</p>
 <input 
 type="text" 
 value={editingSeries.name} 
 onChange={e => setEditingSeries({...editingSeries, name: e.target.value})} 
 className="w-full bg-white/[0.03] p-4 text-white placeholder-white/20 focus:outline-none focus: transition-all"
 placeholder="Display name"
 />
 </div>
 </div>

 <div className="space-y-6 pt-8">
 <div className="flex justify-between items-center">
 <h3 className="text-h4 font-medium text-white tracking-tight">Characters</h3>
 <button 
 onClick={() => setEditingSeries({
 ...editingSeries, 
 characters: [...editingSeries.characters, { id: '', name: '', image: '' }]
 })}
 className="text-micro font-bold text-white hover:text-white/90 transition-colors flex items-center gap-2"
 >
 <BoxyPlus size={16} /> Add Character
 </button>
 </div>

 <div className="space-y-4">
 {editingSeries.characters.map((char, index) => (
 <div key={index} className="flex gap-4 items-center bg-white/[0.02] p-4">
 <div className="w-16 h-16 bg-neutral-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
 {char.image ? (
 <img src={char.image} alt="preview" className="w-full h-full object-cover" />
 ) : (
 <BoxyUser size={24} className="text-white/90" />
 )}
 </div>
 <div className="grid grid-cols-3 gap-4 flex-grow">
 <input 
 type="text" 
 placeholder="Char ID" 
 value={char.id}
 onChange={(e) => {
 const chars = [...editingSeries.characters];
 chars[index].id = e.target.value;
 setEditingSeries({...editingSeries, characters: chars});
 }}
 className="w-full bg-transparent p-2 text-micro text-white placeholder-white/30 focus:outline-none focus:border-primary transition-all"
 />
 <input 
 type="text" 
 placeholder="Display Name" 
 value={char.name}
 onChange={(e) => {
 const chars = [...editingSeries.characters];
 chars[index].name = e.target.value;
 setEditingSeries({...editingSeries, characters: chars});
 }}
 className="w-full bg-transparent p-2 text-micro text-white placeholder-white/30 focus:outline-none focus:border-primary transition-all"
 />
 <input 
 type="text" 
 placeholder="Image URL" 
 value={char.image}
 onChange={(e) => {
 const chars = [...editingSeries.characters];
 chars[index].image = e.target.value;
 setEditingSeries({...editingSeries, characters: chars});
 }}
 className="w-full bg-transparent p-2 text-micro text-white placeholder-white/30 focus:outline-none focus:border-primary transition-all"
 />
 </div>
 <button 
 onClick={() => {
 const chars = editingSeries.characters.filter((_, i) => i !== index);
 setEditingSeries({...editingSeries, characters: chars});
 }}
 className="p-3 text-white/90 hover:text-white hover:bg-neutral-800 transition-all flex-shrink-0"
 >
 <BoxyX size={16} />
 </button>
 </div>
 ))}
 </div>
 </div>

 <div className="pt-8 flex justify-end">
 <button 
 onClick={handleSaveSeries}
 className="bg-white/90 text-black px-10 py-3.5 text-micro font-semibold tracking-tight hover:bg-white transition-all"
 >
 Save Avatar Series
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-12">
 <div className="flex justify-end">
 <button 
 onClick={() => setEditingSeries({ id: '', name: '', characters: [] })}
 className="bg-neutral-900 text-white px-8 py-3 text-micro font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2"
 >
 <BoxyPlus size={16} /> New Series
 </button>
 </div>

 {loading ? (
 <div className="py-24 text-center text-white/90 font-medium">Loading Avatars...</div>
 ) : seriesList.length === 0 ? (
 <div className="py-24 text-center bg-white/[0.02] flex flex-col items-center justify-center gap-2">
 <BoxyUser size={32} className="text-white/90 mb-2" />
 <p className="text-white/90 font-medium tracking-tight">No avatar series found</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {seriesList.map(series => (
 <div key={series.id} className="group bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className="text-h4 font-bold text-white tracking-tight">{series.name}</h3>
 <span className="text-[10px] text-white/90 font-mono tracking-wider">{series.id}</span>
 </div>
 <div className="flex gap-2">
 <button onClick={() => setEditingSeries(series)} className="text-micro font-medium text-white/90 hover:text-white transition-colors">Edit</button>
 <button onClick={() => handleDeleteSeries(series.id)} className="text-micro font-medium text-white/90 hover:text-white transition-colors">Del</button>
 </div>
 </div>
 
 <div className="flex flex-wrap gap-2">
 {series.characters?.slice(0, 5).map(char => (
 <div key={char.id} className="w-10 h-10 rounded-full overflow-hidden bg-black" title={char.name}>
 <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
 </div>
 ))}
 {series.characters?.length > 5 && (
 <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-[10px] font-bold text-white/90">
 +{series.characters.length - 5}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
};

export default AdminAvatars;
