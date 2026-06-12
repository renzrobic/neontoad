import React, { useState } from 'react';
import { BoxyGoogle } from '../components/ui/BoxyIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoFull from '../assets/logo/logo-full.svg';

const Login = () => {
 const [isLogin, setIsLogin] = useState(true);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const { login, register, loginWithGoogle } = useAuth();
 const navigate = useNavigate();

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);
 try {
 if (isLogin) {
 await login(email, password);
 } else {
 await register(email, password);
 }
 navigate('/profiles');
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 const handleGoogleLogin = async () => {
 try {
 await loginWithGoogle();
 navigate('/profiles');
 } catch (err) {
 setError(err.message);
 }
 };

 return (
 <div className="fixed inset-0 flex items-center justify-center px-4 overflow-y-auto z-50">
 {/* Dynamic Background */}
 <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none" />

 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="relative z-10 w-full max-w-md glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-12 rounded-xl mx-auto my-8"
 >
 <div className="text-center mb-8 md:mb-10">
 <div className="mb-6 md:mb-8 flex justify-center items-center">
 <img loading="lazy" src={logoFull} alt="NeonToad" className="h-12 md:h-16 w-auto object-contain transition-all duration-500" />
 </div>
 <div className="w-full h-px bg-white/5 backdrop-blur-md rounded-xl border border-white/10 mb-6 md:mb-8" />
 <h1 className="text-h1 text-white mb-1">
 {isLogin ? 'Sign in' : 'Sign up'}
 </h1>
 </div>

 {error && (
 <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white p-3 rounded-xl text-micro font-medium mb-4 md:mb-6 text-center">
 {error}
 </div>
 )}

 {loading ? (
 <div className="space-y-6 md:space-y-8 animate-pulse">
 <div className="space-y-3">
 <div className="h-2 w-20 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 ml-1" />
 <div className="w-full h-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>
 <div className="space-y-3">
 <div className="h-2 w-20 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 ml-1" />
 <div className="w-full h-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>
 <div className="w-full h-14 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="py-4 md:py-6 flex items-center gap-4">
 <div className="flex-grow h-px bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="h-2 w-24 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 <div className="flex-grow h-px bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>
 <div className="w-full h-14 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
 <div className="space-y-2">
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full h-12 bg-black/20 border border-white/10 rounded-xl px-4 text-white font-medium focus:border-primary focus:bg-white/5 transition-all placeholder:text-netflixGray text-body outline-none"
 placeholder="Enter email"
 />
 </div>

 <div className="space-y-2">
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full h-12 bg-black/20 border border-white/10 rounded-xl px-4 text-white font-medium focus:border-primary focus:bg-white/5 transition-all placeholder:text-netflixGray text-body outline-none"
 placeholder="Password"
 />
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full min-h-[44px] md:min-h-[48px] px-6 py-3 bg-white text-black rounded-xl font-medium text-lg hover:bg-white/90 transition-all disabled:opacity-50 mt-2 tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.15)]"
 >
 {isLogin ? 'Sign in' : 'Sign up'}
 </button>

 <div className="relative py-4 md:py-6 flex items-center">
 <div className="flex-grow"></div>
 <span className="flex-shrink mx-4 text-white text-micro font-medium">social connect</span>
 <div className="flex-grow"></div>
 </div>

 <div className="space-y-4">
 <button
 type="button"
 onClick={handleGoogleLogin}
 className="w-full min-h-[44px] md:min-h-[48px] px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 text-white font-medium text-body rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
 >
 <BoxyGoogle size={18} />
 {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
 </button>
 </div>
 </form>
 )}

 <p className="mt-8 md:mt-12 text-center text-textSecondary text-body">
 {isLogin ?"New to the pond?" :"Already a member?"}
 <button
 onClick={() => setIsLogin(!isLogin)}
 className="ml-2 text-white font-semibold hover:underline transition-all"
 >
 {isLogin ? 'Sign up' : 'Log in'}
 </button>
 </p>
 </motion.div>
 </div>
 );
};

export default Login;
