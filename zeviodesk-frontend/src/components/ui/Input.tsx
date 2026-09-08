import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: boolean | string;
  helperText?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      rightElement,
      error,
      helperText,
      containerClassName = '',
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const hasError = Boolean(error);

    const baseInputStyles =
      'w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60';

    const borderStyles = hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
      : 'border-slate-200 hover:border-slate-300 focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/20';

    const paddingLeft = leftIcon ? 'pl-10' : '';
    const paddingRight = rightIcon || rightElement ? 'pr-10' : '';

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`${baseInputStyles} ${borderStyles} ${paddingLeft} ${paddingRight} ${className}`}
            {...props}
          />
          {rightIcon && !rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {errorMessage && (
          <p className="mt-1 text-xs text-rose-500 font-medium">{errorMessage}</p>
        )}
        {!errorMessage && helperText && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
