import React from 'react';
import { cn } from '../tokens';

type PixelHeadingProps = {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'lg' | 'md' | 'sm';
  className?: string;
};

const sizes = {
  lg: 'text-[30px]',
  md: 'text-[21px]',
  sm: 'text-[15px]'
};

export function PixelHeading({
  children,
  as: Tag = 'h2',
  size = 'md',
  className
}: PixelHeadingProps) {
  return (
    <Tag className={cn('font-pixel leading-none text-ink', sizes[size], className)}>
      {children}
    </Tag>);

}