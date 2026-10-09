import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-10 lg:space-y-14 pb-16 animate-fadeIn ${className}`}>
      {children}
    </div>
  );
};
