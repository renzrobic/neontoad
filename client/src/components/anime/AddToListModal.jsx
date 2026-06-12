import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { BoxyX, BoxyCheck } from '../ui/BoxyIcons';
import { toast } from 'react-hot-toast';

const AddToListModal = ({ isOpen, onClose, anime }) => {
 const { activeProfile, createCustomList, toggleAnimeInCustomList } = useAuth();
 const [newListName, setNewListName] = useState('');
 const [isCreating, setIsCreating] = useState(false);

 if (!isOpen || !anime) return null;

 const customLists = activeProfile?.customLists || [];

 const handleCreateList = async () => {
 if (!newListName.trim()) {
 toast.error('List name cannot be empty');
 return;
 }
 setIsCreating(true);
 try {
 const newList = await createCustomList(newListName);
 toast.success(`Created list"${newList.name}"`);
 setNewListName('');
 // Optionally automatically add the anime to the newly created list
 await toggleAnimeInCustomList(newList.id, anime);
 toast.success(`Added ${anime.title} to ${newList.name}`);
 } catch (err) {
 toast.error(err.message || 'Failed to create list');
 } finally {
 setIsCreating(false);
 }
 };

 const handleToggleAnime = async (listId, listName) => {
 try {
 const added = await toggleAnimeInCustomList(listId, anime);
 if (added) {
 toast.success(`Added to ${listName}`);
 } else {
 toast.success(`Removed from ${listName}`);
 }
 } catch (err) {
 toast.error('Failed to update list');
 }
 };

 return createPortal(
 <AnimatePresence>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-sm"
 onClick={onClose}
 >
 <motion.div
 initial={{ scale: 0.95, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.95, opacity: 0, y: 20 }}
 onClick={(e) => e.stopPropagation()}
 className="relative w-full max-w-lg bg-[#232323] shadow-2xl p-6 md:p-8 overflow-hidden"
 >
 {/* Close Button */}
 <button onClick={onClose}
 className="absolute top-4 right-4 text-netflixGray hover:text-white transition-colors rounded-xl"
 >
 <BoxyX size={24} />
 </button>

 <h2 className="text-h4 md:text-h3 font-medium text-white mb-6 text-center">Add to Custom List</h2>

 {/* Existing Lists */}
 <div className="mb-8 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
 {customLists.map((list) => {
 const isAdded = list.items?.some(i => i.id === anime.id);
 return (
 <button
 key={list.id}
 onClick={() => handleToggleAnime(list.id, list.name)}
 className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left group"
 >
 <span className="text-white font-medium text-body">{list.name}</span>
 <div className={`w-6 h-6 flex items-center justify-center rounded-xl transition-colors border ${isAdded ? 'bg-primary border-primary text-black' : 'border-white/20 text-transparent group-hover:ring-white/80/50'}`}>
 <BoxyCheck size={16} />
 </div>
 </button>
 );
 })}
 {customLists.length === 0 && (
 <p className="text-netflixGray text-micro text-center py-4">You don't have any custom lists yet.</p>
 )}
 </div>

 {/* Create New List Form */}
 <div className="space-y-4">
 <div className="relative">
 <label className="text-[11px] font-medium text-netflixGray uppercase absolute -top-2 left-0">Create New List</label>
 <input
 type="text"
 value={newListName}
 onChange={(e) => setNewListName(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleCreateList();
 }}
 className="w-full bg-transparent border-b border-primary/50 text-white p-2 pt-4 outline-none focus:border-primary transition-colors text-body font-medium placeholder:text-netflixGray"
 placeholder="Name your list..."
 />
 </div>
 
 <div className="flex items-center gap-4 pt-4">
 <button onClick={handleCreateList}
 disabled={isCreating || !newListName.trim()}
 className="flex-1 bg-primary text-black font-medium uppercase text-[12px] py-3.5 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
 >
 Create List
 </button>
 <button onClick={onClose}
 className="flex-1 border border-primary text-primary font-medium uppercase text-[12px] py-3.5 hover:bg-primary hover:text-black transition-colors rounded-xl"
 >
 Cancel
 </button>
 </div>
 </div>
 </motion.div>
 </motion.div>
 </AnimatePresence>,
 document.body
 );
};

export default AddToListModal;
