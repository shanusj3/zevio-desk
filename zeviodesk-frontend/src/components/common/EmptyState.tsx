import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconContainerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  iconContainerClassName = '',
  titleClassName = '',
  descriptionClassName = '',
  size = 'md',
}) => {
  const paddingStyles = {
    sm: 'py-6 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8',
  }[size];

  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  const titleSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg font-bold',
  }[size];

  const isImgElement = React.isValidElement(icon) && typeof icon.type === 'string' && icon.type === 'img';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${paddingStyles} ${className}`}>
      {icon && (
        isImgElement ? (
          <div className={`mb-3 ${iconContainerClassName}`}>
            {icon}
          </div>
        ) : (
          <div
            className={`flex items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 mb-3 shadow-xs ${iconSizes} ${iconContainerClassName}`}
          >
            {icon}
          </div>
        )
      )}
      <h3 className={`text-slate-800 tracking-tight ${titleSizes} ${titleClassName}`}>
        {title}
      </h3>
      {description && (
        <p className={`mt-1 text-xs text-slate-500 max-w-sm leading-relaxed ${descriptionClassName}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
