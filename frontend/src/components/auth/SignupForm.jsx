import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { useAuth } from '../../hooks/useAuth';
import { validateName, calculatePasswordStrength, validateConfirmPassword, sanitizeInput, capitalizeWords } from '../../utils/validators';
import { parseError } from '../../utils/helpers';
import { ERROR_MESSAGES } from '../../utils/constants';

const FREE_EMAIL_DOMAINS = [
  'gmail.com','yahoo.com','yahoo.co.in','yahoo.in','hotmail.com','outlook.com',
  'live.com','aol.com','mail.com','protonmail.com','icloud.com','me.com',
  'ymail.com','rediffmail.com','gmx.com','gmx.net','msn.com','inbox.com',
  'zohomail.com','tutanota.com','fastmail.com','hushmail.com','mailinator.com',
];

const validateBusinessEmail = (email) => {
  if (!email) return 'Business email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || FREE_EMAIL_DOMAINS.includes(domain)) {
    return 'Please use a business email address. Gmail, Yahoo, Hotmail and similar are not allowed.';
  }
  return null;
};

const SignupForm = () => {
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'fullName') newValue = capitalizeWords(newValue);

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(newValue));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validateName(formData.fullName);
    if (nameError) newErrors.fullName = nameError;

    const emailError = validateBusinessEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    if (passwordStrength.errors.length > 0) newErrors.password = passwordStrength.errors[0];

    const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;

    if (!formData.agreedToTerms) newErrors.agreedToTerms = ERROR_MESSAGES.TERMS_REQUIRED;

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
      setRegisteredEmail(formData.email.toLowerCase().trim());
      setVerificationSent(true);
    } catch (error) {
      setApiError(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Check your email</h3>
        <p className="text-sm text-gray-600 mb-1">
          We sent a verification link to
        </p>
        <p className="text-sm font-semibold text-indigo-700 mb-4">{registeredEmail}</p>
        <p className="text-sm text-gray-500 mb-6">
          Click the link in the email to verify your account. Once verified, you can log in.
        </p>
        <Link
          to="/login"
          className="inline-block w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-center"
        >
          Go to Login
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Didn't receive it? Check your spam folder or <button type="button" className="text-indigo-600 hover:underline" onClick={() => setVerificationSent(false)}>try again</button>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {apiError}
        </div>
      )}

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

      <Input
        label="Business Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Enter your business email"
        required
        autoComplete="email"
      />
      {!errors.email && (
        <p className="text-xs text-gray-400 -mt-2">Business domains only — Gmail, Yahoo, Hotmail etc. are not accepted.</p>
      )}

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
          <PasswordStrengthIndicator strength={passwordStrength.strength} errors={passwordStrength.errors} />
        )}
      </div>

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
            <a href="/terms" className="text-primary-blue hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary-blue hover:underline">Privacy Policy</a>
          </span>
        </label>
        {errors.agreedToTerms && <p className="mt-1 text-sm text-primary-red">{errors.agreedToTerms}</p>}
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading || passwordStrength.errors.length > 0}
      >
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-blue font-medium hover:underline">Log in</Link>
      </p>
    </form>
  );
};

export default SignupForm;
