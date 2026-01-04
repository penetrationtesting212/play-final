/**
 * Enterprise-Grade Button Component
 * Supports multiple variants, sizes, states, and accessibility features
 */

import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-transparent',
  secondary: 'bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-hover)] text-white border-transparent',
  success: 'bg-[var(--color-success)] hover:bg-[#0ea76e] text-white border-transparent',
  warning: 'bg-[var(--color-warning)] hover:bg-[#dc8b08] text-white border-transparent',
  danger: 'bg-[var(--color-error)] hover:bg-[#dc2727] text-white border-transparent',
  ghost: 'bg-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border-[var(--color-border)]',
  link: 'bg-transparent hover:underline text-[var(--color-primary)] border-transparent p-0',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      leftIcon,
      rightIcon,
      loadingText,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const widthStyle = isFullWidth ? 'w-full' : '';
    
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;
    
    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
