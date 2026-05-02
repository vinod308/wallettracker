/**
 * Button Component
 * Reusable button with variants and loading state
 */

import React from 'react';
import clsx from 'clsx';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className,
  ...props
}) => {
  const baseClasses = 'btn font-medium rounded-xl transition-all-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-primary-blue text-white hover:bg-[#4338ca] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] focus:ring-primary-blue disabled:bg-gray-200 disabled:text-gray-400',
    secondary: 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-400',
    success: 'bg-primary-green text-white hover:bg-green-700 hover:shadow-[0_4px_12px_rgba(40,167,69,0.3)] focus:ring-primary-green disabled:bg-gray-200',
    danger: 'bg-primary-red text-white hover:bg-red-700 hover:shadow-[0_4px_12px_rgba(220,53,69,0.3)] focus:ring-primary-red disabled:bg-gray-200',
    outline: 'border-1.5 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-primary-blue disabled:border-gray-100 disabled:text-gray-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="spinner mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
