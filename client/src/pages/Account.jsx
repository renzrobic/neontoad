import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail, updateEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
 BoxyCreditCard,
 BoxyUser,
 BoxyShield,
 BoxyMail,
 BoxyKey,
 BoxyList,
 BoxyTV,
 BoxyCheck,
 BoxyAlert
} from '../components/ui/BoxyIcons';
import toast from 'react-hot-toast';

const ToggleSwitch = ({ checked, onChange, label, description }) => (
 <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
 <div className="pr-4">
 <p className="text-white font-medium text-[14px]">{label}</p>
 {description && <p className="text-netflixGray text-[12px] mt-1">{description}</p>}
 </div>
 <button
 onClick={onChange}
 className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-primary' : 'bg-neutral-600'}`}
 >
 <span
 aria-hidden="true"
 className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
 />
 </button>
 </div>
);

const Account = () => {
 const { user, logout, deleteAccount } = useAuth();
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState('membership');

 // MOCK STATE
 const [preferences, setPreferences] = useState({
 matureContent: false,
 autoPlay: true,
 audioDescription: false,
 closedCaptions: true,
 });
 
 const [notifications, setNotifications] = useState({
 deals: true,
 newsletter: false,
 updates: true,
 });

 const [requirePin, setRequirePin] = useState(false);

 const handleLogout = async () => {
 await logout();
 navigate('/login');
 };

 const handlePasswordReset = async () => {
 if (!user?.email) return;
 try {
 await sendPasswordResetEmail(auth, user.email);
 toast.success(`Password reset email sent to ${user.email}`);
 } catch (err) {
 toast.error(err.message || 'Failed to send reset email.');
 }
 };

 const handleEmailChange = async () => {
 const newEmail = window.prompt("Enter your new email address:");
 if (!newEmail || !newEmail.includes('@')) return;
 
 try {
 await updateEmail(auth.currentUser, newEmail);
 toast.success("Email address updated successfully!");
 } catch (err) {
 if (err.code === 'auth/requires-recent-login') {
 toast.error('Security Alert: You must log out and log back in before changing your email.');
 } else {
 toast.error(err.message || 'Failed to update email.');
 }
 }
 };

 const handleDeleteAccount = async () => {
 const confirmDelete = window.confirm("Are you sure you want to delete your entire account? This will permanently remove all your profiles, reels, comments, and data. This action cannot be undone.");
 if (!confirmDelete) return;

 try {
 await deleteAccount();
 toast.success("Account successfully deleted.");
 navigate('/login');
 } catch (err) {
 if (err.code === 'auth/requires-recent-login') {
 toast.error('Security Alert: You must log out and log back in before deleting your account.');
 } else {
 toast.error(err.message || 'Failed to delete account.');
 }
 }
 };

 const SIDEBAR_GROUPS = [
 {
 title:"General",
 items: [
 { id: 'membership', label: 'Membership Info' },
 { id: 'preferences', label: 'Preferences' },
 { id: 'pin', label: 'Profile PIN' },
 { id: 'notifications', label: 'Email Notifications' },
 { id: 'devices', label: 'Device Management' },
 ]
 },
 {
 title:"Account",
 items: [
 { id: 'email', label: 'Email' },
 { id: 'password', label: 'Password' },
 ]
 },
 {
 title:"Purchase & Credit",
 items: [
 { id: 'payment', label: 'Manage Payment Methods' },
 { id: 'billing', label: 'Billing History' },
 ]
 }
 ];

 const renderContent = () => {
 switch (activeTab) {
 case 'membership':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Membership Info</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <div className="flex items-center gap-5 mb-8">
 <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
 <BoxyCreditCard size={28} className="text-primary" />
 </div>
 <div>
 <h3 className="text-xl font-medium text-white">Community Plan</h3>
 <p className="text-netflixLight text-sm mt-1">Free Tier ΓÇó Active</p>
 </div>
 </div>
 <div className="space-y-4 mb-8">
 <div className="flex items-start gap-3">
 <BoxyCheck size={20} className="text-primary flex-shrink-0 mt-0.5" />
 <p className="text-white text-sm">Access to standard library anime up to 1080p</p>
 </div>
 <div className="flex items-start gap-3">
 <BoxyCheck size={20} className="text-primary flex-shrink-0 mt-0.5" />
 <p className="text-white text-sm">Create up to 5 profiles per account</p>
 </div>
 <div className="flex items-start gap-3">
 <BoxyCheck size={20} className="text-netflixGray flex-shrink-0 mt-0.5" />
 <p className="text-netflixGray text-sm line-through">Ad-free viewing experience</p>
 </div>
 <div className="flex items-start gap-3">
 <BoxyCheck size={20} className="text-netflixGray flex-shrink-0 mt-0.5" />
 <p className="text-netflixGray text-sm line-through">Offline downloads</p>
 </div>
 </div>
 <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
 <button onClick={() => toast('Upgrade portal coming soon.')} className="bg-primary text-black font-medium py-3 px-6 rounded-lg hover:bg-primary/90 transition-all text-sm w-full sm:w-auto">Upgrade Plan</button>
 <button onClick={() => toast('Cancel subscription portal.')} className="bg-white/5 text-white font-medium py-3 px-6 rounded-lg hover:bg-white/10 transition-all text-sm w-full sm:w-auto">Cancel Membership</button>
 </div>
 </div>
 </div>
 );

 case 'preferences':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Preferences</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <h3 className="text-white font-medium mb-4">Display & Language</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
 <div>
 <label className="block text-[12px] font-medium text-netflixGray uppercase mb-2">Display Language</label>
 <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-primary">
 <option value="en">English (US)</option>
 <option value="es">Espa├▒ol</option>
 <option value="fr">Fran├ºais</option>
 <option value="jp">µùÑµ£¼Φ¬₧</option>
 </select>
 </div>
 <div>
 <label className="block text-[12px] font-medium text-netflixGray uppercase mb-2">Audio Language</label>
 <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-primary">
 <option value="jp">Japanese</option>
 <option value="en">English (Dub)</option>
 </select>
 </div>
 </div>

 <h3 className="text-white font-medium mb-4 mt-8">Playback Settings</h3>
 <div className="space-y-2">
 <ToggleSwitch 
 label="Auto-Play Next Episode" 
 description="Automatically start the next episode when the current one finishes."
 checked={preferences.autoPlay} 
 onChange={() => setPreferences(p => ({...p, autoPlay: !p.autoPlay}))} 
 />
 <ToggleSwitch 
 label="Closed Captions (CC)" 
 description="Show closed captions by default when available."
 checked={preferences.closedCaptions} 
 onChange={() => setPreferences(p => ({...p, closedCaptions: !p.closedCaptions}))} 
 />
 <ToggleSwitch 
 label="Audio Description" 
 description="Enable descriptive audio for visually impaired users by default."
 checked={preferences.audioDescription} 
 onChange={() => setPreferences(p => ({...p, audioDescription: !p.audioDescription}))} 
 />
 </div>

 <h3 className="text-white font-medium mb-4 mt-8">Content Restrictions</h3>
 <div className="space-y-2">
 <ToggleSwitch 
 label="Show Mature Content (18+)" 
 description="Allow display of mature rated anime in your feed and search results."
 checked={preferences.matureContent} 
 onChange={() => setPreferences(p => ({...p, matureContent: !p.matureContent}))} 
 />
 </div>
 </div>
 </div>
 );

 case 'pin':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Profile PIN</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <div className="flex items-start gap-4 mb-8">
 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
 <BoxyShield size={24} className="text-white" />
 </div>
 <div>
 <h3 className="text-white font-medium text-lg mb-2">Secure Your Profile</h3>
 <p className="text-netflixLight text-sm leading-relaxed">
 Require a 4-digit PIN to access your specific profile or change your maturity rating settings. This prevents other people on your account from viewing your watch history or messing with your recommendations.
 </p>
 </div>
 </div>
 <ToggleSwitch 
 label="Require PIN for this Profile" 
 checked={requirePin} 
 onChange={() => {
 setRequirePin(!requirePin);
 toast(requirePin ? 'PIN requirement disabled.' : 'Please set up a PIN in the modal.');
 }} 
 />
 </div>
 </div>
 );

 case 'notifications':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Email Notifications</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <h3 className="text-white font-medium mb-2">Manage Subscriptions</h3>
 <p className="text-netflixGray text-sm mb-6">Choose what you want to hear about at {user?.email || 'your email'}.</p>
 
 <div className="space-y-2">
 <ToggleSwitch 
 label="Store Deals & Offers" 
 description="Exclusive discounts on premium memberships, cosmetics, and merch."
 checked={notifications.deals} 
 onChange={() => setNotifications(p => ({...p, deals: !p.deals}))} 
 />
 <ToggleSwitch 
 label="Weekly Newsletter" 
 description="A summary of the top trending anime and what to watch this weekend."
 checked={notifications.newsletter} 
 onChange={() => setNotifications(p => ({...p, newsletter: !p.newsletter}))} 
 />
 <ToggleSwitch 
 label="Product Updates" 
 description="Important announcements about new platform features and improvements."
 checked={notifications.updates} 
 onChange={() => setNotifications(p => ({...p, updates: !p.updates}))} 
 />
 </div>
 </div>
 </div>
 );

 case 'devices':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Device Management</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-white font-medium mb-1">Active Devices</h3>
 <p className="text-netflixGray text-sm">Devices recently active on this account.</p>
 </div>
 <button onClick={() => { toast.success('All sessions terminated.'); handleLogout(); }} className="text-[13px] font-medium text-netflixGray hover:text-white transition-colors">Sign Out All</button>
 </div>

 <div className="space-y-4">
 {/* Current Device */}
 <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <BoxyTV size={24} className="text-primary" />
 <div>
 <p className="text-white font-medium text-sm">Chrome on Windows (Current)</p>
 <p className="text-netflixGray text-[12px] mt-0.5">Manila, PH ΓÇó Active now</p>
 </div>
 </div>
 <span className="text-[11px] font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">This Device</span>
 </div>

 {/* Mock Device */}
 <div className="bg-transparent border border-white/10 rounded-xl p-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <BoxyTV size={24} className="text-netflixLight" />
 <div>
 <p className="text-white font-medium text-sm">NeonToad iOS App on iPhone 16</p>
 <p className="text-netflixGray text-[12px] mt-0.5">Tokyo, JP ΓÇó Active 2 days ago</p>
 </div>
 </div>
 <button onClick={() => toast.success('Device deactivated')} className="text-[13px] font-medium text-netflixLight hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg">Deactivate</button>
 </div>
 </div>
 </div>
 </div>
 );

 case 'email':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Email Address</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <div className="mb-8">
 <label className="block text-[12px] font-medium text-netflixGray uppercase mb-2">Current Email</label>
 <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm flex items-center justify-between">
 <span>{user?.email || 'Loading...'}</span>
 <BoxyCheck size={16} className="text-primary" />
 </div>
 </div>
 <button onClick={handleEmailChange} className="bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-white/90 transition-all text-sm">Change Email Address</button>
 </div>
 </div>
 );

 case 'password':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Password</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <div className="flex items-start gap-4 mb-8">
 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
 <BoxyKey size={24} className="text-white" />
 </div>
 <div>
 <h3 className="text-white font-medium text-lg mb-2">Reset Password</h3>
 <p className="text-netflixLight text-sm leading-relaxed">
 We will send a password reset link to your email address. For security reasons, you may be required to log back in after changing your password on some devices.
 </p>
 </div>
 </div>
 <button onClick={handlePasswordReset} className="bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-white/90 transition-all text-sm">Send Reset Email</button>
 </div>
 </div>
 );

 case 'payment':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Payment Methods</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 p-6 md:p-8">
 <div className="bg-transparent border border-white/10 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
 <BoxyCreditCard size={32} className="text-netflixGray" />
 </div>
 <h3 className="text-white font-medium text-lg mb-2">No Payment Methods</h3>
 <p className="text-netflixGray text-sm max-w-sm mb-6">You currently have no saved credit cards or PayPal accounts linked to this profile.</p>
 <button onClick={() => toast('Stripe integration pending')} className="bg-white/10 text-white font-medium py-3 px-6 rounded-lg hover:bg-white/20 transition-all text-sm">Add Payment Method</button>
 </div>
 </div>
 </div>
 );

 case 'billing':
 return (
 <div className="space-y-6">
 <h2 className="text-2xl font-medium text-white">Billing History</h2>
 <div className="bg-[#1c1c1c] rounded-xl border border-white/10 overflow-hidden">
 <div className="p-6 md:p-8 border-b border-white/10">
 <h3 className="text-white font-medium">Past Invoices</h3>
 <p className="text-netflixGray text-sm mt-1">Review your recent transactions and membership charges.</p>
 </div>
 <div className="p-8 text-center bg-white/[0.02]">
 <BoxyList size={32} className="text-netflixGray mx-auto mb-4" />
 <p className="text-netflixGray text-sm">No billing history found.</p>
 </div>
 </div>
 </div>
 );

 default:
 return null;
 }
 };

 return (
 <div className="min-h-screen bg-transparent pt-24 md:pt-32 pb-20 px-6 md:px-16">
 <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-10">
 
 {/* Sidebar Navigation */}
 <div className="w-full md:w-[280px] flex-shrink-0">
 <h1 className="text-h3 md:text-h2 font-medium text-white mb-8">Account Settings</h1>
 
 <div className="flex flex-row md:flex-col overflow-x-auto no-scrollbar gap-8 md:gap-6 pb-4 md:pb-0 border-b border-white/10 md:border-none">
 {SIDEBAR_GROUPS.map((group, idx) => (
 <div key={idx} className="flex-shrink-0">
 <h4 className="text-[11px] font-medium text-netflixGray uppercase mb-3 px-4 hidden md:block">{group.title}</h4>
 <div className="flex flex-row md:flex-col gap-1">
 {group.items.map(item => {
 const isActive = activeTab === item.id;
 return (
 <button
 key={item.id}
 onClick={() => setActiveTab(item.id)}
 className={`text-left px-4 py-2.5 rounded-lg font-medium text-[14px] transition-all whitespace-nowrap ${
 isActive 
 ? 'bg-primary/10 text-primary font-medium' 
 : 'text-netflixLight hover:text-white hover:bg-white/5'
 }`}
 >
 {item.label}
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 
 <div className="mt-8 md:mt-12 pt-6 border-t border-white/10 hidden md:block px-4">
 <button onClick={handleDeleteAccount} className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors flex items-center gap-2">
 <BoxyAlert size={16} /> Delete Account
 </button>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-grow max-w-3xl min-w-0">
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.2 }}
 >
 {renderContent()}
 </motion.div>
 </AnimatePresence>
 
 {/* Mobile Delete Account */}
 <div className="mt-12 pt-6 border-t border-white/10 md:hidden flex justify-center">
 <button onClick={handleDeleteAccount} className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors flex items-center gap-2">
 <BoxyAlert size={16} /> Delete Account
 </button>
 </div>
 </div>

 </div>
 </div>
 );
};

export default Account;
