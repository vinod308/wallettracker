/**
 * Reset Password Form Component
 * Implements exact reset password flow from specification (Section 2.3.5)
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import authService from '../../services/authService';
import { calculatePasswordStrength, validateConfirmPassword } from '../../utils/validators';
import { parseError } from '../../utils/helpers';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 'Weak', errors: [] });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update password strength in real-time
    if (name === 'newPassword') {
      const strength = calculatePasswordStrength(value);
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

    // Password validation
    if (passwordStrength.errors.length > 0) {
      newErrors.newPassword = passwordStrength.errors[0];
    }

    // Confirm password validation
    const confirmError = validateConfirmPassword(formData.newPassword, formData.confirmPassword);
    if (confirmError) {
      newErrors.confirmPassword = confirmError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!token) {
      setApiError('Invalid or missing reset token');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.newPassword, formData.confirmPassword);

      // Show success message (exact from spec)
      setSuccess(true);

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setApiError(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded">
          <div className="text-4xl mb-3">✓</div>
          <p className="font-medium text-lg">Password reset successful!</p>
          <p className="text-sm mt-1">You can now log in with your new password</p>
        </div>

        <p className="text-sm text-gray-600">
          Redirecting to login page in 3 seconds...
        </p>

        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {apiError}
        </div>
      )}

      {/* New Password Field */}
      <div>
        <Input
          label="New Password"
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          placeholder="Enter new password"
          required
          autoComplete="new-password"
          showPasswordToggle
          showCapsLockWarning
        />
        {formData.newPassword && (
          <PasswordStrengthIndicator
            strength={passwordStrength.strength}
            errors={passwordStrength.errors}
          />
        )}
      </div>

      {/* Confirm Password Field */}
      <Input
        label="Confirm New Password"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        placeholder="Re-enter new password"
        required
        autoComplete="new-password"
        showPasswordToggle
      />

      {/* Reset Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading || passwordStrength.errors.length > 0}
      >
        Reset Password
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
