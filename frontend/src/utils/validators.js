/**
 * Frontend Validation Functions
 * Exact validation rules matching backend
 */

import { VALIDATION_RULES, ERROR_MESSAGES, PASSWORD_STRENGTH } from './constants';

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) {
    return ERROR_MESSAGES.EMAIL_REQUIRED;
  }
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return ERROR_MESSAGES.EMAIL_INVALID;
  }
  if (email.length > VALIDATION_RULES.EMAIL_MAX_LENGTH) {
    return 'Email must not exceed 255 characters';
  }
  return null;
};

/**
 * Validate full name
 */
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return ERROR_MESSAGES.NAME_REQUIRED;
  }
  if (name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return ERROR_MESSAGES.NAME_MIN;
  }
  if (name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    return ERROR_MESSAGES.NAME_MAX;
  }
  if (!VALIDATION_RULES.NAME_REGEX.test(name)) {
    return ERROR_MESSAGES.NAME_PATTERN;
  }
  return null;
};

/**
 * Calculate password strength (exact from spec)
 * Returns: { strength: 'Weak'|'Medium'|'Strong'|'Very Strong', errors: [] }
 */
export const calculatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(ERROR_MESSAGES.PASSWORD_MIN);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(ERROR_MESSAGES.PASSWORD_UPPERCASE);
  }

  if (!/[0-9]/.test(password)) {
    errors.push(ERROR_MESSAGES.PASSWORD_NUMBER);
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push(ERROR_MESSAGES.PASSWORD_SPECIAL);
  }

  // Calculate strength
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  const characterTypes = [hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length;

  let strength = PASSWORD_STRENGTH.WEAK;

  if (password.length >= 12 && characterTypes === 3) {
    strength = PASSWORD_STRENGTH.VERY_STRONG;
  } else if (password.length >= 8 && characterTypes === 3) {
    strength = PASSWORD_STRENGTH.STRONG;
  } else if (password.length >= 8 && characterTypes >= 2) {
    strength = PASSWORD_STRENGTH.MEDIUM;
  }

  return { strength, errors };
};

/**
 * Validate password
 */
export const validatePassword = (password) => {
  if (!password) {
    return [ERROR_MESSAGES.PASSWORD_REQUIRED];
  }

  const { errors } = calculatePasswordStrength(password);
  return errors.length > 0 ? errors : null;
};

/**
 * Validate confirm password
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  }
  if (password !== confirmPassword) {
    return ERROR_MESSAGES.PASSWORDS_MISMATCH;
  }
  return null;
};

/**
 * Check if Caps Lock is on (for password fields)
 */
export const isCapsLockOn = (event) => {
  return event.getModifierState && event.getModifierState('CapsLock');
};

/**
 * Sanitize input (trim and remove extra spaces)
 */
export const sanitizeInput = (value) => {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ');
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Check if email is business email
 */
export const isBusinessEmail = (email) => {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  return !personalDomains.includes(domain);
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate project name
 */
export const validateProjectName = (projectName) => {
  if (!projectName || !projectName.trim()) {
    return 'Project name is required';
  }
  if (projectName.length < 3) {
    return 'Project name must be at least 3 characters';
  }
  if (projectName.length > 100) {
    return 'Project name cannot exceed 100 characters';
  }
  return null;
};

/**
 * Validate amount
 */
export const validateAmount = (amount) => {
  if (!amount) {
    return 'Amount is required';
  }
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return 'Amount must be greater than 0';
  }
  if (parseFloat(amount) > 10000000) {
    return 'Amount cannot exceed ₹10,00,00,000';
  }
  return null;
};

/**
 * Validate client name
 */
export const validateClientName = (clientName) => {
  if (!clientName || !clientName.trim()) {
    return 'Client name is required';
  }
  if (clientName.length < 2) {
    return 'Client name must be at least 2 characters';
  }
  if (clientName.length > 100) {
    return 'Client name cannot exceed 100 characters';
  }
  return null;
};
