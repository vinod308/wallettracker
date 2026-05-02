/**
 * Login Page
 * Complete login page layout (Section 2.1 of spec)
 */

import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import logo from '../assets/logo.png';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="Garage WalletTracker" className="h-11 mx-auto mb-4 object-contain" />
          <h2 className="text-xl text-gray-800 font-semibold">
            Welcome to GarageWallet
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
