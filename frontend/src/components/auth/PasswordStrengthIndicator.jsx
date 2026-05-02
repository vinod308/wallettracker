/**
 * Password Strength Indicator
 * Visual indicator for password strength (exact from spec)
 */

import React from 'react';
import { PASSWORD_STRENGTH_COLORS, PASSWORD_STRENGTH_BG } from '../../utils/constants';

const PasswordStrengthIndicator = ({ strength, errors }) => {
  const strengthLevels = ['Weak', 'Medium', 'Strong', 'Very Strong'];
  const currentLevel = strengthLevels.indexOf(strength);

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="flex gap-1 mb-2">
        {strengthLevels.map((level, index) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded transition-all duration-300 ${
              index <= currentLevel
                ? PASSWORD_STRENGTH_BG[strength]
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${PASSWORD_STRENGTH_COLORS[strength]}`}>
          {strength}
        </span>
        <span className="text-xs text-gray-500">
          {currentLevel + 1} / {strengthLevels.length}
        </span>
      </div>

      {/* Requirements */}
      {errors.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-medium">Password must contain:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li className={errors.some(e => e.includes('8 characters')) ? 'text-red-600' : 'text-green-600'}>
              8+ characters
            </li>
            <li className={errors.some(e => e.includes('uppercase')) ? 'text-red-600' : 'text-green-600'}>
              1 uppercase letter
            </li>
            <li className={errors.some(e => e.includes('number')) ? 'text-red-600' : 'text-green-600'}>
              1 number
            </li>
            <li className={errors.some(e => e.includes('special character')) ? 'text-red-600' : 'text-green-600'}>
              1 special character (!@#$%^&*)
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
