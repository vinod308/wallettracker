/**
 * Role Route Component
 * Requires specific role(s) to access (exact from spec)
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

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

  // Check if user has required role
  const hasRole = allowedRoles.includes(user?.role);

  if (!hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource.
          </p>
          <a
            href="/dashboard"
            className="text-primary-blue hover:underline font-medium"
          >
            ← Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleRoute;
