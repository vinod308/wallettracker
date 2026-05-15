/**
 * Forgot Password Page
 * Password reset request page (Section 2.3 of spec)
 */

import React from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import logo from '../assets/logo.jpeg';

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="MoneyGence" className="h-11 mx-auto mb-4 object-contain" />
          <h2 className="text-xl text-gray-800 font-semibold">
            Reset Your Password
          </h2>
        </div>

        {/* Forgot Password Form Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
