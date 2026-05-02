/**
 * Login Form Component
 * Implements exact login flow from specification (Section 2.1)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validators';
import { parseError } from '../../utils/helpers';
import { ERROR_MESSAGES } from '../../utils/constants';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation (exact from spec)
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Password validation (exact from spec)
    if (!formData.password) {
      newErrors.password = ERROR_MESSAGES.PASSWORD_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      // Redirect to dashboard (exact from spec: Section 2.1.8)
      navigate('/dashboard');
    } catch (error) {
      // Display exact error message from backend
      setApiError(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
          {apiError}
        </div>
      )}

      {/* Email Field */}
      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Enter your email"
        required
        autoComplete="email"
      />

      {/* Password Field */}
      <Input
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="Enter your password"
        required
        autoComplete="current-password"
        showPasswordToggle
        showCapsLockWarning
      />

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="mr-2 h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
          />
          <span className="text-sm text-gray-700">Remember Me</span>
        </label>

        <a
          href="/forgot-password"
          className="text-sm text-primary-blue hover:underline"
        >
          Forgot Password?
        </a>
      </div>

      {/* Login Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        Login
      </Button>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/signup" className="text-primary-blue font-medium hover:underline">
          Sign up
        </a>
      </p>
    </form>
  );
};

export default LoginForm;
