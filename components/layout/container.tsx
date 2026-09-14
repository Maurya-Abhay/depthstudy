import type { HTMLAttributes } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthMap = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-none',
};

export function Container({
  className = '',
  size = 'lg',
  ...props
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full ${maxWidthMap[size]} px-4 sm:px-6 lg:px-8 ${className}`}
      {...props}
    />
  );
}