import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: 'default' | 'compact' | 'wide';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = 'default',
  className = '',
}) => {
  const colClasses = {
    default: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    compact: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    wide: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${colClasses} gap-3 sm:gap-4 lg:gap-5 ${className}`}>
      {children}
    </div>
  );
};
