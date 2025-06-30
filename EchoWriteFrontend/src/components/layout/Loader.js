// frontend/src/components/Spinner.js
import React from 'react';

const Spinner = ({ 
  size = 'medium', 
  color = 'indigo', 
  text = '', 
  fullScreen = false,
  className = '' 
}) => {
  // Size configurations
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  // Color configurations
  const colorClasses = {
    indigo: 'border-indigo-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    teal: 'border-teal-600',
    purple: 'border-purple-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          border-4 
          ${colorClasses[color]} 
          border-t-transparent 
          rounded-full 
          animate-spin
        `}
      ></div>
      {text && (
        <p className={`mt-3 text-sm text-gray-600 dark:text-gray-300 ${
          size === 'small' ? 'text-xs' : 
          size === 'large' || size === 'xlarge' ? 'text-base' : 'text-sm'
        }`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80 flex items-center justify-center z-50">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

export default Spinner;