import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

const AdminRoute = ({ children }) => {
 const { user, isAdmin, loading } = useAuth();
 const location = useLocation();

 if (loading) {
 return <PageLoader />;
 }

 // If not logged in, or logged in but NOT an admin, block access
 if (!user || !isAdmin) {
 return <Navigate to="/" state={{ from: location }} replace />;
 }

 return children;
};

export default AdminRoute;
