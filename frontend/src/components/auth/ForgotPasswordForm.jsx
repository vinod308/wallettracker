/**
 * Forgot Password Form Component
 * Implements exact forgot password flow from specification (Section 2.3)
 */

import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import authService from '../../services/authService';
import { validateEmail } from '../../utils/validators';
import { parseError } from '../../utils/helpers';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);

      // Show success message (exact from spec: Section 2.3.3)
      setSuccess(true);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <p className="font-medium">Password reset link has been sent to your email</p>
          <p className="text-sm mt-1">Please check your inbox and spam folder</p>
        </div>

        <div className="text-sm text-gray-600">
          <p>Didn't receive the email?</p>
          <button
            onClick={() => setSuccess(false)}
            className="text-primary-blue hover:underline mt-2"
          >
            Try again
          </button>
        </div>

        <div className="pt-4">
          <a
            href="/login"
            className="text-primary-blue hover:underline text-sm font-medium"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="text-center mb-6">
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Email Field */}
      <Input
        label="Email"
        type="email"
        name="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError('');
        }}
        error={error && !email ? error : ''}
        placeholder="Enter your email"
        required
        autoComplete="email"
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        Send Reset Link
      </Button>

      {/* Back to Login Link */}
      <div className="text-center">
        <a
          href="/login"
          className="text-sm text-primary-blue hover:underline"
        >
          ← Back to Login
        </a>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
