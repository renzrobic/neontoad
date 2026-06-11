import React from 'react';
import { Link } from 'react-router-dom';
import { BoxyFacebook, BoxyTwitter, BoxyInstagram, BoxyGithub } from '../ui/BoxyIcons';
import logoFull from '../../assets/logo/logo-full.svg';

const Footer = () => {
 return (
 <footer className="bg-transparent backdrop-blur-2xl pt-20 pb-10">
 <div className="max-w-7xl mx-auto px-6 md:px-16">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
 <div className="flex flex-col items-center md:items-start space-y-8">
 <img loading="lazy" src={logoFull} alt="NeonToad" className="h-16 md:h-[86px] w-auto mx-auto md:mx-0" />
 <p className="text-white/90 text-body leading-relaxed font-medium max-w-sm text-center md:text-left tracking-tight">
 The ultimate destination for premium anime streaming. Experience high-quality simulcasts and an ever-growing library of your favorite series.
 </p>
 <div className="flex justify-center md:justify-start gap-4">
 <a href="#" onClick={(e) => e.preventDefault()} className="w-10 h-10 glass flex items-center justify-center text-white/90 hover:text-white hover: transition-all" aria-label="Facebook">
 <BoxyFacebook size={18} />
 </a>
 <a href="#" onClick={(e) => e.preventDefault()} className="w-10 h-10 glass flex items-center justify-center text-white/90 hover:text-white hover: transition-all" aria-label="Twitter">
 <BoxyTwitter size={18} />
 </a>
 <a href="#" onClick={(e) => e.preventDefault()} className="w-10 h-10 glass flex items-center justify-center text-white/90 hover:text-white hover: transition-all" aria-label="Instagram">
 <BoxyInstagram size={18} />
 </a>
 <a href="#" onClick={(e) => e.preventDefault()} className="w-10 h-10 glass flex items-center justify-center text-white/90 hover:text-white hover: transition-all" aria-label="GitHub">
 <BoxyGithub size={18} />
 </a>
 </div>
 </div>

 <div className="space-y-6">
 <h4 className="text-white font-medium text-h4 tracking-tight">Navigation</h4>
 <ul className="space-y-4 text-white/90 font-medium text-body tracking-tight">
 <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
 <li><Link to="/library" className="hover:text-white transition-colors">Library</Link></li>
 <li><Link to="/calendar" className="hover:text-white transition-colors">Calendar</Link></li>
 <li><Link to="/reel" className="hover:text-white transition-colors">Reels</Link></li>
 <li><Link to="/profiles" className="hover:text-white transition-colors">Profiles</Link></li>
 </ul>
 </div>

 <div className="space-y-6">
 <h4 className="text-white font-medium text-h4 tracking-tight">Support</h4>
 <ul className="space-y-4 text-white/90 font-medium text-body tracking-tight">
 <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
 <li><Link to="/terms" className="hover:text-white transition-colors">Terms Of Service</Link></li>
 <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
 <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Preferences</Link></li>
 </ul>
 </div>

 <div className="space-y-6">
 <h4 className="text-white font-medium text-h4 tracking-tight">Experience</h4>
 <div className="glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-4">
 <p className="text-body text-white/90 font-medium leading-relaxed tracking-tight">
 Experience the best of anime with NeonToad. Follow us on social media for updates!
 </p>
 </div>
 </div>
 </div>

 <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
 <p className="text-[11px] font-medium text-white/90 tracking-tight">
 © 2026 NeonToad Media Inc. All Rights Reserved.
 </p>
 <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[11px] font-medium text-white/90 tracking-tight">
 <span>Corporate Information</span>
 <span>Legal Notices</span>
 </div>
 </div>
 </div>
 </footer>
 );
};

export default Footer;
