import React from 'react';

const Input = ({ id, name, type = 'text', placeholder, value, onChange, onBlur, icon: Icon, error }) => {
  return (
    <div className="w-full">
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`
            w-full py-2.5 border rounded-lg text-gray-700
            transition-all duration-300
            focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:outline-none
            ${Icon ? 'pl-10' : 'pl-4'}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;