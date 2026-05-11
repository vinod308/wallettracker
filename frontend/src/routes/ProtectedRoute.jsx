/**
 * Protected Route Component
 * Requires authentication to access
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vendors can only access /vendor-portal
  if (user?.role === 'vendor') {
    return <Navigate to="/vendor-portal" replace />;
  }

  // Vendor managers can only access /vendors and /vendors/:id
  if (user?.role === 'vendor_manager' && !pathname.startsWith('/vendors')) {
    return <Navigate to="/vendors" replace />;
  }

  return children;
};

export default ProtectedRoute;
