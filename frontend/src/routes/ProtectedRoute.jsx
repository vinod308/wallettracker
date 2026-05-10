/**
 * Protected Route Component
 * Requires authentication to access
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

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

  // Vendors can only access /vendor-portal — redirect away from all other protected routes
  if (user?.role === 'vendor') {
    return <Navigate to="/vendor-portal" replace />;
  }

  return children;
};

export default ProtectedRoute;
