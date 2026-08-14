import React from 'react';

interface AdminPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminPageContainer: React.FC<AdminPageContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 sm:py-5 md:py-6 space-y-5 sm:space-y-6 ${className}`}
    >
      {children}
    </div>
  );
};
