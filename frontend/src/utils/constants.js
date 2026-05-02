/**
 * Frontend Constants
 * Matching backend constants exactly
 */

export const USER_ROLES = {
  ADMIN: 'Admin',
  ACCOUNT_MANAGER: 'Account Manager',
  FINANCE: 'Finance',
};

export const VALIDATION_RULES = {
  // Password Rules (exact from spec)
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,

  // Name Rules
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  NAME_REGEX: /^[A-Za-z\s]+$/,

  // Email Rules
  EMAIL_MAX_LENGTH: 255,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Project/Client Name Rules
  PROJECT_NAME_MIN: 3,
  PROJECT_NAME_MAX: 100,
  CLIENT_NAME_MIN: 2,
  CLIENT_NAME_MAX: 100,

  // Amount Rules
  MAX_AMOUNT: 100000000, // ₹10 crore
};

export const ERROR_MESSAGES = {
  // Name Validation (exact from spec)
  NAME_REQUIRED: 'Name is required',
  NAME_MIN: 'Name must be at least 2 characters',
  NAME_MAX: 'Name must not exceed 50 characters',
  NAME_PATTERN: 'Name can only contain letters and spaces',

  // Email Validation (exact from spec)
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_EXISTS: 'This email is already registered',

  // Password Validation (exact from spec)
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN: 'Password must be at least 8 characters',
  PASSWORD_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_NUMBER: 'Password must contain at least one number',
  PASSWORD_SPECIAL: 'Password must contain at least one special character (!@#$%^&*)',

  // Confirm Password (exact from spec)
  CONFIRM_PASSWORD_REQUIRED: 'Please confirm your password',
  PASSWORDS_MISMATCH: 'Passwords do not match',

  // Terms (exact from spec)
  TERMS_REQUIRED: 'You must agree to Terms of Service to continue',

  // Generic
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
};

export const PASSWORD_STRENGTH = {
  WEAK: 'Weak',
  MEDIUM: 'Medium',
  STRONG: 'Strong',
  VERY_STRONG: 'Very Strong',
};

export const PASSWORD_STRENGTH_COLORS = {
  Weak: 'text-red-600',
  Medium: 'text-yellow-600',
  Strong: 'text-green-600',
  'Very Strong': 'text-green-700',
};

export const PASSWORD_STRENGTH_BG = {
  Weak: 'bg-red-200',
  Medium: 'bg-yellow-200',
  Strong: 'bg-green-200',
  'Very Strong': 'bg-green-300',
};

// Session timeout (exact from spec)
export const SESSION_TIMEOUT_MINUTES = 30;
export const INACTIVITY_WARNING_MINUTES = 28;

// Date range options
export const DATE_RANGES = [
  'This Month',
  'Last 3 Months',
  'Year to Date',
  'Custom Range',
];

// Client types
export const CLIENT_TYPES = ['Retainer', 'Contractor'];

// Services (matching backend seed data)
export const SERVICES = [
  'Social Media',
  'Performance Marketing',
  'SEO',
  'Design',
  'Web Development',
  'Analytics',
  'Content Marketing',
  'Paid Ads',
  'Maintenance',
];
