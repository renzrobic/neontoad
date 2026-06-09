import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BoxySearch, BoxyUser, BoxyShield, BoxyLogOut, BoxyMenu, BoxyX, BoxyReels } from '../ui/BoxyIcons';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationHub from './NotificationHub';
import logoFull from '../../assets/logo/logo-full.svg';
import SafeImage from '../ui/SafeImage';

const Navbar = () => {
 const [isScrolled, setIsScrolled] = useState(false);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [isNotifOpen, setIsNotifOpen] = useState(false);
 const { user, logout, activeProfile, isAdmin } = useAuth();
 const navigate = useNavigate();
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');

 useEffect(() => {
 const handleScroll = () => {
 setIsScrolled(window.scrollY > 0);
 };
 window.addEventListener('scroll', handleScroll);
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 const handleLogout = async () => {
 try {
 await logout();
 navigate('/login');
 } catch (error) {
 console.error("Logout failed", error);
 }
 };

 return (
 <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 pt-[env(safe-area-inset-top)] ${isScrolled ? 'bg-background/80 backdrop-blur-2xl' : 'bg-gradient-to-b from-background/80 to-transparent'}`}>
 {/* Mobile menu backdrop */}
 {isMobileMenuOpen && (
 <div
 className="fixed inset-0 z-[90] md:hidden"
 onClick={() => setIsMobileMenuOpen(false)}
 />
 )}
 <div className={`w-full px-4 md:px-16 flex items-center justify-between transition-all duration-500 ${isScrolled ? 'py-1' : 'py-2'}`}>
 <div className="flex items-center gap-12">
 <Link
 to="/"
 className="flex items-center transition-all duration-300"
 >
 <img loading="lazy"
 src={logoFull}
 alt="NeonToad"
 className={`h-[40px] md:h-[64px] w-auto transition-all duration-500 ${isSearchOpen ? 'md:flex' : ''}`}
 />
 </Link>
 <div className="hidden md:flex items-center gap-10 text-body font-semibold tracking-tight text-white/90">
 <Link to="/" className="hover:text-white transition-colors">Home</Link>
 <Link to="/library" className="hover:text-white transition-colors">Library</Link>
 <Link to="/calendar" className="hover:text-white transition-colors">Calendar</Link>
 <Link to="/reel" className="hover:text-white transition-colors">Clips</Link>
 </div>
 </div>

 <div className="flex items-center gap-2 md:gap-6">
 <div className="relative flex items-center z-[110]">
 <AnimatePresence>
 {isSearchOpen && (
 <motion.div
 initial={{ width: 0, opacity: 0 }}
 animate={{ width: 'auto', opacity: 1 }}
 exit={{ width: 0, opacity: 0 }}
 className="flex items-center overflow-hidden"
 >
 <input
 autoFocus
 type="text"
 placeholder="Search..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 navigate(`/search?q=${searchQuery}`);
 setIsSearchOpen(false);
 }
 }}
 onBlur={() => {
 if (!searchQuery) setIsSearchOpen(false);
 }}
 className="bg-black/60 backdrop-blur-2xl px-4 py-2 text-body font-medium focus: outline-none w-[160px] md:w-[280px] tracking-tight rounded-none shadow-2xl"
 />
 </motion.div>
 )}
 </AnimatePresence>
 <button
 onClick={() => {
 const next = !isSearchOpen;
 setIsSearchOpen(next);
 if (next) {
 setIsNotifOpen(false);
 setIsMobileMenuOpen(false);
 }
 }}
 className="p-2.5 hover:text-white transition-colors flex items-center justify-center relative z-[120]"
 aria-label="Search"
 >
 <BoxySearch size={22} />
 </button>
 </div>

 {user && (
 <NotificationHub
 isOpen={isNotifOpen}
 onToggle={(val) => {
 setIsNotifOpen(val);
 if (val) {
 setIsMobileMenuOpen(false);
 setIsSearchOpen(false);
 }
 }}
 />
 )}

 {/* Clips Shortcut (Mobile Only) */}
 <Link to="/reel" className="md:hidden p-2 text-white/90 hover:text-white transition-colors">
 <BoxyReels size={22} />
 </Link>

 {user ? (
 <div
 className="flex items-center gap-2 group/profile relative"
 >
 {/* Desktop profile avatar with dropdown */}
 <div
 className="hidden md:block"
 onClick={() => {}}
 >
 <div className={`w-9 h-9 md:w-10 md:h-10 rounded-none overflow-hidden transition-all cursor-pointer border-transparent hover:`}>
 <SafeImage
 src={activeProfile?.avatarUrl ||"https://wallpapers-clan.com/wp-content/uploads/2023/02/jujutsu-kaisen-satoru-gojo-pfp-1.jpg"}
 alt="Profile"
 className="w-full h-full object-cover"
 />
 </div>
 </div>

 {/* Desktop Dropdown Menu */}
 <div className="hidden md:block absolute top-full right-0 mt-4 w-64 bg-black/80 backdrop-blur-3xl shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-300 z-[110] rounded-none">
 <div className="p-4">
 <p className="text-body font-bold text-white truncate tracking-tight">{activeProfile?.name || 'User'}</p>
 <p className="text-micro font-medium text-white/90 truncate tracking-tight mt-0.5">{user.email}</p>
 </div>
 <div className="p-2 space-y-1">
 {isAdmin && (
 <Link to="/admin" className="flex items-center gap-3 px-3 py-2 text-body font-medium text-[#86E95C] hover:bg-neutral-900 rounded-none transition-colors tracking-tight">
 <BoxyShield size={16} /> Admin Dashboard
 </Link>
 )}
 <Link to="/profiles" className="flex items-center gap-3 px-3 py-2 text-body font-medium hover:bg-neutral-900 rounded-none transition-colors tracking-tight">
 <BoxyUser size={16} /> Switch profile
 </Link>
 <Link to="/account" className="flex items-center gap-3 px-3 py-2 text-body font-medium hover:bg-neutral-900 rounded-none transition-colors tracking-tight">
 <BoxyShield size={16} /> Account settings
 </Link>
 <button
 onClick={handleLogout}
 className="w-full flex items-center gap-3 px-3 py-2 text-body font-medium text-white/90 hover:text-white hover:bg-neutral-900 rounded-none transition-colors tracking-tight"
 >
 <BoxyLogOut size={16} /> Sign out
 </button>
 </div>
 </div>

 {/* Mobile hamburger button */}
 <button
 className="md:hidden p-2 text-white/90 hover:text-white transition-colors"
 onClick={() => {
 const newVal = !isMobileMenuOpen;
 setIsMobileMenuOpen(newVal);
 if (newVal) {
 setIsNotifOpen(false);
 setIsSearchOpen(false);
 }
 }}
 aria-label="Toggle Menu"
 >
 {isMobileMenuOpen ? <BoxyX size={22} /> : <BoxyMenu size={22} />}
 </button>
 </div>
 ) : (
 <Link to="/login">
 <BoxyUser size={22} className="hover:text-white transition-colors" />
 </Link>
 )}
 </div>
 </div>

 {/* Mobile Menu */}
 <AnimatePresence>
 {isMobileMenuOpen && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="md:hidden bg-background overflow-hidden"
 >
 {user && (
 <div className="p-6 bg-neutral-900 flex items-center gap-4">
 <div className="w-12 h-12 overflow-hidden">
 <img loading="lazy" src={activeProfile?.avatarUrl} className="w-full h-full object-cover" alt="" />
 </div>
 <div>
 <p className="text-micro font-medium text-white tracking-tight">{activeProfile?.name}</p>
 <p className="text-micro font-medium text-white/90 tracking-tight">Active profile</p>
 </div>
 </div>
 )}
 <div className="flex flex-col p-8 gap-8">
 <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium hover:text-white transition-colors tracking-tight">Home</Link>
 <Link to="/library" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium hover:text-white transition-colors tracking-tight">Library</Link>
 <Link to="/calendar" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium hover:text-white transition-colors tracking-tight">Calendar</Link>
 <Link to="/reel" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium hover:text-white transition-colors tracking-tight">Clips</Link>
 <hr className="" />
 {user ? (
 <div className="flex flex-col gap-8">
 {isAdmin && (
 <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium text-[#86E95C] hover:text-[#86E95C]/80 transition-colors tracking-tight">Admin Dashboard</Link>
 )}
 <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium hover:text-white transition-colors tracking-tight">Account settings</Link>
 <Link to="/profiles" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium hover:text-white transition-colors tracking-tight">Switch profile</Link>
 <button onClick={handleLogout} className="text-left text-h4 font-medium text-white/90 hover:text-white transition-colors tracking-tight">Sign out</button>
 </div>
 ) : (
 <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-h4 font-medium text-white tracking-tight">Login / register</Link>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </nav>
 );
};

export default Navbar;
