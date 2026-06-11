import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail, updateEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
 BoxyCreditCard,
 BoxyUser,
 BoxyShield,
 BoxyPlus,
 BoxyHelp,
 BoxyExternal,
 BoxyMail,
 BoxyKey
} from '../components/ui/BoxyIcons';
import toast from 'react-hot-toast';

const Account = () => {
 const { user, profiles, logout, deleteAccount } = useAuth();
 const navigate = useNavigate();

 const handleLogout = async () => {
 await logout();
 navigate('/login');
 };

 const handleDeleteAccount = async () => {
 const confirmDelete = window.confirm("Are you sure you want to delete your entire account? This will permanently remove all your profiles, reels, comments, and data. This action cannot be undone."
 );
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

 const handlePasswordReset = async () => {
 if (!user?.email) return;
 try {
 await sendPasswordResetEmail(auth, user.email);
 toast.success(`Password reset email sent to ${user.email}`);
 } catch (err) {
 toast.error(err.message || 'Failed to send reset email.');
 console.error(err);
 }
 };

 const handleEmailChange = async () => {
 const newEmail = window.prompt("Enter your new email address:");
 if (!newEmail || !newEmail.includes('@')) return;
 
 try {
 await updateEmail(auth.currentUser, newEmail);
 toast.success("Email address updated successfully!");
 } catch (err) {
 console.error(err);
 if (err.code === 'auth/requires-recent-login') {
 toast.error('Security Alert: You must log out and log back in before changing your email.');
 } else {
 toast.error(err.message || 'Failed to update email.');
 }
 }
 };

 return (
 <div className="min-h-screen bg-transparent pt-24 md:pt-32 pb-20 px-6 md:px-16">
 <div className="w-full">
 <h1 className="text-[48px] md:text-[64px] font-bold text-white mb-12 tracking-tighter">Account</h1>

 <div className="space-y-12">
 {/* Membership & Billing */}
 <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
 <div className="text-white/90 font-semibold text-body uppercase tracking-widest flex items-center gap-3">
 <BoxyCreditCard size={20} className="text-white/90" /> Membership & Billing
 </div>
 <div className="md:col-span-2 space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="space-y-1">
 <p className="text-white font-medium text-body truncate max-w-[280px]">{user?.email}</p>
 <p className="text-white/90 text-body font-medium">Password: ********</p>
 </div>

 </div>
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 gap-4">
 <div className="flex items-center gap-4">
 <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white/90 px-4 py-1.5 rounded-xl">
 <span className="font-medium text-micro tracking-tight">Standard</span>
 </div>
 <p className="text-white/90 font-medium text-body">Free tier access active.</p>
 </div>
 <button onClick={() => toast('Gift code portal coming soon.')} className="text-white/90 font-medium hover:text-white transition-colors text-body tracking-tight w-full sm:w-auto text-left sm:text-right">Redeem code</button>
 </div>
 </div>
 </section>

 {/* Plan Details */}
 <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
 <div className="text-white/90 font-semibold text-body uppercase tracking-widest flex items-center gap-3">
 <BoxyShield size={20} className="text-white/90" /> Plan Details
 </div>
 <div className="md:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex items-center gap-4">
 <span className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white/90 px-4 py-1.5 rounded-xl font-medium text-micro tracking-tight">Standard</span>
 <p className="text-white/90 font-medium text-body">Community plan (1080p)</p>
 </div>
 <button onClick={() => toast('Advanced tiers not yet released.')} className="text-white/90 font-medium hover:text-white transition-colors text-body tracking-tight w-full sm:w-auto text-left sm:text-right">View benefits</button>
 </div>
 </section>

 {/* Profiles */}
 <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
 <div className="text-white/90 font-semibold text-body uppercase tracking-widest flex items-center gap-3">
 <BoxyUser size={20} className="text-white/90" /> Profiles
 </div>
 <div className="md:col-span-2">
 <div className="flex flex-wrap gap-8 mb-8">
 {profiles.map(profile => (
 <div key={profile.id} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => navigate(`/profiles/edit/${profile.id}`)}>
 <div className="w-16 h-16 rounded-xl overflow-hidden group-hover: transition-all opacity-80 group-hover:opacity-100">
 <img loading="lazy" src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
 </div>
 <span className="text-white/90 text-body font-semibold tracking-tight group-hover:text-white transition-colors mt-2">{profile.name}</span>
 </div>
 ))}
 {profiles.length < 5 && (
 <Link to="/profiles/create" className="w-16 h-16 glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 backdrop-blur-md rounded-xl transition-all group">
 <BoxyPlus className="text-white/90 group-hover:text-white/90 transition-colors" />
 </Link>
 )}
 </div>
 <Link to="/profiles/manage" className="text-white/90 font-medium hover:text-white transition-colors text-body tracking-tight">Manage all profiles</Link>
 </div>
 </section>

 {/* Settings */}
 <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
 <div className="text-white/90 font-semibold text-body uppercase tracking-widest flex items-center gap-3">
 <BoxyShield size={20} className="text-white/90" /> Settings
 </div>
 <div className="md:col-span-2 space-y-4">
 <button onClick={() => toast('Device synchronization active.')} className="text-white/90 font-medium hover:text-white transition-colors text-body block tracking-tight text-left">Activate a device</button>
 <button onClick={() => { toast.success('All sessions terminated.'); handleLogout(); }} className="text-white/90 font-medium hover:text-white transition-colors text-body block tracking-tight text-left">Sign out of all devices</button>
 <button onClick={handleDeleteAccount} className="text-red-500/80 font-medium hover:text-red-500 transition-colors text-body block tracking-tight text-left mt-4 pt-4 w-full sm:w-auto rounded-xl">Delete Account</button>
 </div>
 </section>
 </div>

 <div className="mt-20 flex justify-center">
 <button
 onClick={handleLogout}
 className="w-full max-w-sm min-h-[44px] md:min-h-[48px] glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white/90 px-16 py-3 font-medium text-body hover:text-white hover:bg-white/10 backdrop-blur-md rounded-xl transition-all tracking-tight flex items-center justify-center"
 >
 Sign out of NeonToad
 </button>
 </div>
 </div>
 </div>
 );
};

export default Account;
