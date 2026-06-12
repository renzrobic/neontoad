import React from 'react';
import { Link } from 'react-router-dom';
import { BoxySearch, BoxyHome } from '../components/ui/BoxyIcons';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
 return (
 <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-center px-4">
 <Helmet>
 <title>Page Not Found | NeonToad</title>
 </Helmet>
 <div className="py-24 px-4 flex flex-col md:flex-row items-center justify-center gap-12 max-w-4xl w-full">
 {/* Mascot Placeholder */}
 <div className="w-64 h-64 md:w-80 md:h-80 bg-white/5 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10 flex-shrink-0 relative overflow-hidden group">
 <img 
 src="/images/mascots/toady-404.svg" 
 alt="Toady Mascot - 404" 
 className="absolute inset-0 w-full h-full object-contain z-10 transition-opacity"
 onError={(e) => e.target.style.opacity = 0}
 />
 <div className="text-netflixGray text-center px-4 absolute inset-0 flex flex-col items-center justify-center -z-0">
 <BoxySearch size={48} className="mx-auto mb-2 opacity-50" />
 <p className="text-micro font-medium uppercase">Toady Mascot</p>
 <p className="text-[10px] mt-1">/images/mascots/toady-404.svg</p>
 </div>
 </div>

 {/* Text Content */}
 <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
 <h1 className="text-[120px] md:text-[150px] font-medium text-white/5 leading-none absolute -z-10 left-1/2 md:left-auto md:right-10 top-1/2 -translate-y-1/2 -translate-x-1/2 md:translate-x-0">404</h1>
 <h2 className="text-h3 md:text-h2 font-medium text-white">Are you lost?</h2>
 <p className="text-micro md:text-[15px] font-normal text-netflixGray max-w-sm leading-relaxed mb-4">
 The page you are looking for doesn't exist or has been moved. Let's get you back to the anime.
 </p>
 <Link
 to="/"
 className="bg-primary text-black px-10 py-4 rounded-md font-medium text-micro flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
 >
 <BoxyHome size={20} fill="currentColor" />
 Return Home
 </Link>
 </div>
 </div>
 </div>
 );
};

export default NotFound;
