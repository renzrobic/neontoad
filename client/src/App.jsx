import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Navbar from './components/layout/Navbar';
import PageLoader from './components/ui/PageLoader';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';

const lazyLoad = (importFunc) => lazy(() =>
 importFunc().catch((error) => {
 // Prevent infinite reload loops on network errors
 const key = 'chunkReloadCount';
 const count = parseInt(sessionStorage.getItem(key) || '0');
 if (count < 2) {
 sessionStorage.setItem(key, String(count + 1));
 window.location.reload();
 }
 // Throw so ErrorBoundary catches it after max retries
 throw error;
 })
);

const Home = lazyLoad(() => import('./pages/Home'));
const Watch = lazyLoad(() => import('./pages/Watch'));
const Login = lazyLoad(() => import('./pages/Login'));
const Reel = lazyLoad(() => import('./pages/Reel'));
const Calendar = lazyLoad(() => import('./pages/Calendar'));
const AnimeDetail = lazyLoad(() => import('./pages/AnimeDetail'));
const Library = lazyLoad(() => import('./pages/Library'));
const Profiles = lazyLoad(() => import('./pages/Profiles'));
const ManageProfiles = lazyLoad(() => import('./pages/ManageProfiles'));
const EditProfile = lazyLoad(() => import('./pages/EditProfile'));
const Account = lazyLoad(() => import('./pages/Account'));
const SeedData = lazyLoad(() => import('./pages/SeedData'));
const Search = lazyLoad(() => import('./pages/Search'));
const NotificationsPage = lazyLoad(() => import('./pages/Notifications'));
const Support = lazyLoad(() => import('./pages/Support'));
const Admin = lazyLoad(() => import('./pages/Admin'));
const NewsDetail = lazyLoad(() => import('./pages/NewsDetail'));
const NotFound = lazyLoad(() => import('./pages/NotFound'));
const MyList = lazyLoad(() => import('./pages/MyList'));
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

const SiteConfigManager = ({ children }) => {
 const [config, setConfig] = useState(null);
 const { user, isAdmin } = useAuth();

 useEffect(() => {
 const unsub = onSnapshot(doc(db, 'siteConfig', 'global'), (doc) => {
 if (doc.exists()) {
 const data = doc.data();
 setConfig(data);
 if (data.themeColor) {
 document.documentElement.style.setProperty('--brand-color', data.themeColor);
 }
 } else {
 setConfig({ themeColor: '#86E95C', maintenanceMode: false, seoTitle: 'NeonToad - Anime Streaming', seoDescription: 'Stream your favorite anime.' });
 }
 });
 return unsub;
 }, []);

 if (!config) return <PageLoader />;

 if (config.maintenanceMode && !isAdmin) {
 return (
 <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-white space-y-6 font-sans p-4 text-center">
 <Helmet><title>Maintenance - NeonToad</title></Helmet>
 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
 <h1 className="text-h2 font-medium uppercase">Site Under Maintenance</h1>
 <p className="text-white max-w-md text-micro">We are currently upgrading our systems to bring you a better experience. Please check back later.</p>
 </div>
 );
 }
 
 return (
 <>
 <Helmet>
 <title>{config.seoTitle || 'NeonToad - Anime Streaming'}</title>
 <meta name="description" content={config.seoDescription || ''} />
 </Helmet>
 {children}
 </>
 );
};

import RouteLoader from './components/ui/RouteLoader';

// Ensure a unique deviceId exists for tracking concurrent streams
if (!localStorage.getItem('deviceId')) {
 localStorage.setItem('deviceId', 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now());
}

function App() {
 return (
 <HelmetProvider>
 <AuthProvider>
 <Router>
 <RouteLoader />
 <Toaster 
 position="bottom-center"
 toastOptions={{
 style: {
 borderRadius: '0',
 background: '#0D0D0D',
 color: '#fff',
 border: '1px solid rgba(134,233,92,0.3)',
 boxShadow: '0 0 20px rgba(134,233,92,0.1)',
 fontSize: '12px',
 fontWeight: 'bold',
 },
 }}
 />
 <SiteConfigManager>
 <ErrorBoundary>
 <MainLayout>
 <Suspense fallback={<PageLoader />}>
 <Routes>
 <Route path="/login" element={<Login />} />
 
 <Route path="/" element={<Home />} />
 <Route path="/calendar" element={<Calendar />} />
 
 <Route path="/library" element={
 <ProtectedRoute>
 <Library />
 </ProtectedRoute>
 } />
 
 <Route path="/mylist" element={
 <ProtectedRoute>
 <MyList />
 </ProtectedRoute>
 } />
 
 <Route path="/search" element={<Search />} />
 <Route path="/anime/:id" element={<AnimeDetail />} />
 
 <Route path="/watch/:episodeId" element={
 <ProtectedRoute>
 <Watch />
 </ProtectedRoute>
 } />
 
 {/* Profile Management */}
 <Route path="/profiles" element={
 <ProtectedRoute>
 <Profiles />
 </ProtectedRoute>
 } />
 <Route path="/profiles/manage" element={
 <ProtectedRoute>
 <ManageProfiles />
 </ProtectedRoute>
 } />
 <Route path="/profiles/create" element={
 <ProtectedRoute>
 <EditProfile />
 </ProtectedRoute>
 } />
 <Route path="/profiles/edit/:id" element={
 <ProtectedRoute>
 <EditProfile />
 </ProtectedRoute>
 } />
 
 <Route path="/account" element={
 <ProtectedRoute>
 <Account />
 </ProtectedRoute>
 } />
 
 <Route path="/reel/:reelId?" element={
 <ProtectedRoute>
 <Reel />
 </ProtectedRoute>
 } />
 <Route path="/notifications" element={<NotificationsPage />} />
 <Route path="/help" element={<Support title="Help Center" />} />
 <Route path="/terms" element={<Support title="Terms of Service" />} />
 <Route path="/privacy" element={<Support title="Privacy Policy" />} />
 <Route path="/cookies" element={<Support title="Cookie Preferences" />} />
 <Route path="/admin" element={
 <AdminRoute>
 <Admin />
 </AdminRoute>
 } />
 <Route path="/seed" element={
 <AdminRoute>
 <SeedData />
 </AdminRoute>
 } />
 <Route path="/news/:id" element={<NewsDetail />} />
 
 {/* Catch-all Route for 404 Pages */}
 <Route path="*" element={<NotFound />} />
 </Routes>
 </Suspense>
 </MainLayout>
 </ErrorBoundary>
 </SiteConfigManager>
 </Router>
 </AuthProvider>
 </HelmetProvider>
 );
}

export default App;
