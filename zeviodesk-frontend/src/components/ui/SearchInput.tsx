import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string;
  onChange: (value: string, event?: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  containerClassName?: string;
  variant?: 'default' | 'pill';
  size?: 'sm' | 'md' | 'lg';
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = 'Search...',
      containerClassName = '',
      className = '',
      variant = 'default',
      size = 'md',
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else {
        onChange('');
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value, e);
    };

    const roundedStyle = variant === 'pill' ? 'rounded-full' : 'rounded-xl';

    const sizeStyles = {
      sm: 'h-8 text-xs pl-8 pr-8',
      md: 'h-10 text-sm pl-9 pr-9',
      lg: 'h-11 text-sm pl-10 pr-10',
    }[size];

    const iconSizeStyles = {
      sm: 'w-3.5 h-3.5 left-2.5',
      md: 'w-4 h-4 left-3',
      lg: 'w-4 h-4 left-3.5',
    }[size];

    const clearButtonStyles = {
      sm: 'right-2 p-0.5',
      md: 'right-2.5 p-1',
      lg: 'right-3 p-1',
    }[size];

    return (
      <div className={`relative flex items-center w-full ${containerClassName}`}>
        <Search
          className={`absolute ${iconSizeStyles} text-slate-400 pointer-events-none transition-colors shrink-0`}
        />
        <input
          ref={ref}
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/20 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed ${roundedStyle} ${sizeStyles} ${className}`}
          {...props}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute ${clearButtonStyles} text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center`}
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
