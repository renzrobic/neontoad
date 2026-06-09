import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
 const { user, loading, activeProfile } = useAuth();
 const location = useLocation();

 if (loading) {
 return (
 <div className="h-screen bg-background" />
 );
 }

 if (!user) {
 return <Navigate to="/login" state={{ from: location }} replace />;
 }

 // If logged in but no profile selected, redirect to profile selection
 // except when already on profile selection or creation pages
 const isProfilePage = location.pathname.startsWith('/profiles');
 
 if (!activeProfile && !isProfilePage) {
 return <Navigate to="/profiles" replace />;
 }

 return children;
};

export default ProtectedRoute;
