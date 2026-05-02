/**
 * Loader Component
 * Loading spinner
 */

import React from 'react';
import clsx from 'clsx';

const Loader = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={clsx('flex justify-center items-center', className)}>
      <div
        className={clsx(
          'spinner border-primary-blue border-t-transparent rounded-full animate-spin',
          sizeClasses[size]
        )}
        style={{ animation: 'spin 0.6s linear infinite' }}
      ></div>
    </div>
  );
};

export default Loader;
