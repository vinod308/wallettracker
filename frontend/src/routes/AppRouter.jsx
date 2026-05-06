/**
 * App Router
 * Main routing configuration with lazy-loaded pages for performance
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Auth Pages (eagerly loaded — needed immediately)
import LoginPage from '../pages/LoginPage';

// Lazy-loaded pages (code-split for faster initial load)
const SignupPage = lazy(() => import('../pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ClientsPage = lazy(() => import('../pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('../pages/ClientDetailPage'));
const WalletIntelligencePage = lazy(() => import('../pages/WalletIntelligencePage'));
const ContractsPage = lazy(() => import('../pages/ContractsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const AIOverviewPage = lazy(() => import('../pages/AIOverviewPage'));
const OnboardedClientPage   = lazy(() => import('../pages/OnboardedClientPage'));
const CompanyDetailsPage    = lazy(() => import('../pages/CompanyDetailsPage'));
const VendorManagementPage  = lazy(() => import('../pages/VendorManagementPage'));
const VendorDetailPage      = lazy(() => import('../pages/VendorDetailPage'));

// Route Guards
import ProtectedRoute from './ProtectedRoute';

// Loading fallback for lazy pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
    <div className="text-center">
      <div className="w-8 h-8 border-3 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/:id"
            element={
              <ProtectedRoute>
                <ClientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/onboarded/:clientId"
            element={
              <ProtectedRoute>
                <OnboardedClientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletIntelligencePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-overview"
            element={
              <ProtectedRoute>
                <AIOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts"
            element={
              <ProtectedRoute>
                <ContractsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-details"
            element={
              <ProtectedRoute>
                <CompanyDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <VendorManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:vendorId"
            element={
              <ProtectedRoute>
                <VendorDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Page not found</p>
                  <Link to="/" className="text-primary-blue hover:underline mt-4 inline-block">
                    Go Home
                  </Link>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
