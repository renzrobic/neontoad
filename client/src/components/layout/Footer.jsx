import React from 'react';
import { Link } from 'react-router-dom';
import { BoxyFacebook, BoxyTwitter, BoxyInstagram, BoxyGithub } from '../ui/BoxyIcons';

const Footer = () => {
 return (
 <footer className="bg-transparent pt-16 pb-12 mt-12">
 <div className="max-w-7xl mx-auto px-6 md:px-16">
 
 {/* Social Icons */}
 <div className="flex gap-6 mb-8">
 <a href="#" onClick={(e) => e.preventDefault()} className="text-netflixGray hover:text-white transition-colors" aria-label="Facebook">
 <BoxyFacebook size={24} />
 </a>
 <a href="#" onClick={(e) => e.preventDefault()} className="text-netflixGray hover:text-white transition-colors" aria-label="Instagram">
 <BoxyInstagram size={24} />
 </a>
 <a href="#" onClick={(e) => e.preventDefault()} className="text-netflixGray hover:text-white transition-colors" aria-label="Twitter">
 <BoxyTwitter size={24} />
 </a>
 <a href="#" onClick={(e) => e.preventDefault()} className="text-netflixGray hover:text-white transition-colors" aria-label="GitHub">
 <BoxyGithub size={24} />
 </a>
 </div>

 {/* Links Grid */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-12 mb-8">
 <Link to="/" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Home</Link>
 <Link to="/library" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Library</Link>
 <Link to="/calendar" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Release Calendar</Link>
 <Link to="/reel" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Reels</Link>
 
 <Link to="/profiles" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Profiles</Link>
 <Link to="/help" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Help Center</Link>
 <Link to="/terms" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Terms Of Service</Link>
 <Link to="/privacy" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Privacy Policy</Link>
 
 <Link to="/cookies" className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Cookie Preferences</Link>
 <a href="#" onClick={e => e.preventDefault()} className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Corporate Information</a>
 <a href="#" onClick={e => e.preventDefault()} className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Legal Notices</a>
 <a href="#" onClick={e => e.preventDefault()} className="text-netflixGray hover:underline transition-colors text-[13px] font-medium">Contact Us</a>
 </div>

 {/* Copyright */}
 <p className="text-netflixGray text-[11px] font-medium mt-12">
 &copy; {new Date().getFullYear()} NeonToad Media Inc.
 </p>
 
 </div>
 </footer>
 );
};

export default Footer;
