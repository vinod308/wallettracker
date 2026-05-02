/**
 * Signup Page
 * Complete signup page layout (Section 2.2 of spec)
 */

import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import logo from '../assets/logo.png';

const SignupPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="Garage WalletTracker" className="h-11 mx-auto mb-4 object-contain" />
          <h2 className="text-xl text-gray-800 font-semibold">
            Create Your Account
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Start tracking revenue and opportunities
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
