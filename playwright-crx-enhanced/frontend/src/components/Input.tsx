/**
 * Enterprise-Grade Input Component
 * Provides consistent form input styling with validation states
 */

import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isFullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    
    const containerWidth = isFullWidth ? 'w-full' : '';
    
    const inputStyles = `
      px-3 py-2 
      bg-[var(--color-background)] 
      border rounded-md
      text-[var(--color-text)]
      placeholder-[var(--color-text-tertiary)]
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
      disabled:opacity-50 disabled:cursor-not-allowed
      ${hasError ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-[var(--color-border)]'}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
      ${className}
    `;
    
    return (
      <div className={`flex flex-col gap-1 ${containerWidth}`}>
        {label && (
          <label className="text-sm font-medium text-[var(--color-text)]">
            {label}
            {props.required && <span className="text-[var(--color-error)] ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={inputStyles}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={`text-xs ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isFullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      isFullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    
    const containerWidth = isFullWidth ? 'w-full' : '';
    
    const textareaStyles = `
      px-3 py-2 
      bg-[var(--color-background)] 
      border rounded-md
      text-[var(--color-text)]
      placeholder-[var(--color-text-tertiary)]
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
      disabled:opacity-50 disabled:cursor-not-allowed
      resize-vertical
      ${hasError ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-[var(--color-border)]'}
      ${className}
    `;
    
    return (
      <div className={`flex flex-col gap-1 ${containerWidth}`}>
        {label && (
          <label className="text-sm font-medium text-[var(--color-text)]">
            {label}
            {props.required && <span className="text-[var(--color-error)] ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={textareaStyles}
          {...props}
        />
        
        {(error || helperText) && (
          <p className={`text-xs ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isFullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      isFullWidth = false,
      options,
      className = '',
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    
    const containerWidth = isFullWidth ? 'w-full' : '';
    
    const selectStyles = `
      px-3 py-2 
      bg-[var(--color-background)] 
      border rounded-md
      text-[var(--color-text)]
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
      disabled:opacity-50 disabled:cursor-not-allowed
      cursor-pointer
      ${hasError ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-[var(--color-border)]'}
      ${className}
    `;
    
    return (
      <div className={`flex flex-col gap-1 ${containerWidth}`}>
        {label && (
          <label className="text-sm font-medium text-[var(--color-text)]">
            {label}
            {props.required && <span className="text-[var(--color-error)] ml-1">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          className={selectStyles}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        
        {(error || helperText) && (
          <p className={`text-xs ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
