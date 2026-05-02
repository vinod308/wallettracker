/**
 * Signup Form Component
 * Implements exact signup flow from specification (Section 2.2)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validateName, calculatePasswordStrength, validateConfirmPassword, sanitizeInput, capitalizeWords } from '../../utils/validators';
import { parseError } from '../../utils/helpers';
import { ERROR_MESSAGES } from '../../utils/constants';

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ strength: 'Weak', errors: [] });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    // Auto-capitalize full name (exact from spec)
    if (name === 'fullName') {
      newValue = capitalizeWords(newValue);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Update password strength in real-time
    if (name === 'password') {
      const strength = calculatePasswordStrength(newValue);
      setPasswordStrength(strength);
    }

    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Full name validation (exact from spec)
    const nameError = validateName(formData.fullName);
    if (nameError) {
      newErrors.fullName = nameError;
    }

    // Email validation (exact from spec)
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Password validation (exact from spec)
    if (passwordStrength.errors.length > 0) {
      newErrors.password = passwordStrength.errors[0];
    }

    // Confirm password validation (exact from spec)
    const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmError) {
      newErrors.confirmPassword = confirmError;
    }

    // Terms validation (exact from spec)
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = ERROR_MESSAGES.TERMS_REQUIRED;
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
      await signup({
        fullName: sanitizeInput(formData.fullName),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        agreedToTerms: 'true',
      });

      // Redirect to dashboard (exact from spec: Section 2.2.4)
      navigate('/dashboard');
    } catch (error) {
      setApiError(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {apiError}
        </div>
      )}

      {/* Full Name Field */}
      <Input
        label="Full Name"
        type="text"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        error={errors.fullName}
        placeholder="Enter your full name"
        required
        autoComplete="name"
      />

      {/* Email Field */}
      <Input
        label="Work Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Enter your work email"
        required
        autoComplete="email"
      />

      {/* Password Field with Strength Indicator */}
      <div>
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Create a strong password"
          required
          autoComplete="new-password"
          showPasswordToggle
          showCapsLockWarning
        />
        {formData.password && (
          <PasswordStrengthIndicator
            strength={passwordStrength.strength}
            errors={passwordStrength.errors}
          />
        )}
      </div>

      {/* Confirm Password Field */}
      <Input
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        placeholder="Re-enter your password"
        required
        autoComplete="new-password"
        showPasswordToggle
      />

      {/* Terms Checkbox */}
      <div>
        <label className="flex items-start">
          <input
            type="checkbox"
            name="agreedToTerms"
            checked={formData.agreedToTerms}
            onChange={handleChange}
            className="mt-1 mr-2 h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" className="text-primary-blue hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary-blue hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.agreedToTerms && (
          <p className="mt-1 text-sm text-primary-red">{errors.agreedToTerms}</p>
        )}
      </div>

      {/* Sign Up Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading || passwordStrength.errors.length > 0}
      >
        Sign Up
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-primary-blue font-medium hover:underline">
          Log in
        </a>
      </p>
    </form>
  );
};

export default SignupForm;
