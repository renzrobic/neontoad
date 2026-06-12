import React from 'react';
 import { BoxyInfo } from './BoxyIcons';

class ErrorBoundary extends React.Component {
 constructor(props) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error) {
 return { hasError: true, error };
 }

 componentDidCatch(error, errorInfo) {
 console.error("ErrorBoundary caught an error", error, errorInfo);
 }

 render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-center px-4">
 <div className="py-24 px-4 flex flex-col md:flex-row items-center justify-center gap-12 max-w-4xl w-full">
 {/* Mascot Placeholder */}
 <div className="w-64 h-64 md:w-80 md:h-80 bg-white/5 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10 flex-shrink-0 relative overflow-hidden group">
 <img 
 src="/images/mascots/toady-error.svg" 
 alt="Toady Mascot - System Error" 
 className="absolute inset-0 w-full h-full object-contain z-10 transition-opacity" 
 onError={(e) => e.target.style.opacity = 0}
 />
 <div className="text-netflixGray text-center px-4 absolute inset-0 flex flex-col items-center justify-center -z-0">
 <BoxyInfo size={48} className="mx-auto mb-2 opacity-50" />
 <p className="text-micro font-medium uppercase">Toady Mascot</p>
 <p className="text-[10px] mt-1">/images/mascots/toady-error.svg</p>
 </div>
 </div>

 {/* Text Content */}
 <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4 max-w-md">
 <h1 className="text-h3 md:text-h2 font-medium text-white">Oops, something went wrong</h1>
 <p className="text-micro md:text-[15px] font-normal text-netflixGray leading-relaxed mb-4">
 We hit a small snag trying to load this section. Refreshing the page usually fixes this.
 </p>
 <button
 onClick={() => window.location.reload()}
 className="px-8 py-4 bg-primary text-black font-medium rounded-md transition-all text-micro shadow-xl hover:scale-105 active:scale-95"
 >
 Refresh Page
 </button>
 </div>
 </div>
 </div>
 );
 }

 return this.props.children; 
 }
}

export default ErrorBoundary;
