import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#116dff] text-white hover:bg-[#0052cc] active:bg-[#0041a3] border border-transparent shadow-sm focus:ring-2 focus:ring-[#116dff]/30',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-transparent focus:ring-2 focus:ring-slate-400/20',
  outline:
    'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 active:bg-slate-100 focus:ring-2 focus:ring-slate-300/30',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border border-transparent focus:ring-2 focus:ring-slate-300/20',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent shadow-sm focus:ring-2 focus:ring-rose-500/30',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs h-8 gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm h-10 gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-base h-12 gap-2.5 rounded-xl',
  icon: 'p-2 w-10 h-10 rounded-xl justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
    const computedClassName = `${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={computedClassName}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
