import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
 const location = useLocation();
 const isNoUI = location.pathname === '/login' || 
 location.pathname === '/admin' ||
 location.pathname.startsWith('/reel') || 
 location.pathname.startsWith('/watch') ||
 location.pathname.startsWith('/profiles');

 return (
 <div className="bg-transparent min-h-screen text-white flex flex-col">
 {!isNoUI && <Navbar />}
 <main className="flex-grow">
 {children}
 </main>
 {!isNoUI && <Footer />}
 </div>
 );
};

export default MainLayout;
