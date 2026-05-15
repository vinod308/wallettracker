/**
 * Reset Password Page
 * Password reset with token page (Section 2.3.5 of spec)
 */

import React from 'react';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-blue mb-2">
            MoneyGence
          </h1>
          <h2 className="text-xl text-gray-700 font-medium">
            Create New Password
          </h2>
        </div>

        {/* Reset Password Form Card */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-8">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
