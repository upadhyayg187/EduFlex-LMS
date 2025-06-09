import React from 'react';

const Button = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  fullWidth = false,
  variant = 'primary', // 'primary', 'secondary'
}) => {
  // Base classes for all buttons
  const baseClasses = `
    font-bold py-2.5 px-6 rounded-lg
    transition-transform transform duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:scale-[0.98]
  `;

  // Variant-specific classes
  const variantClasses = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
      disabled:bg-gray-400 disabled:cursor-not-allowed
    `,
    secondary: `
      bg-gray-200 text-gray-800
      hover:bg-gray-300
      focus:ring-gray-400
      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
    `,
  };

  // Width class
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass}`}
    >
      {children}
    </button>
  );
};

export default Button;