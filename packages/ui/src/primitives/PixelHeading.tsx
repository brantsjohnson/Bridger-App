// ============================================
// WHAT THIS FILE DOES (plain English):
// The retro pixel section title (Home, Friends, Discover…). This is the single
// loudest bit of Bridger's personality, so it is the ONLY place we use the pixel
// font — never for body copy (DESIGN.md rule). Three sizes; everything else
// about it is deliberately plain.
// ============================================
import React from 'react';
import { Text } from 'react-native';
import { cn } from '../lib/cn';

type Size = 'lg' | 'md' | 'sm';

// Pixel fonts clip if the line-height equals the font-size, so each size gets a
// slightly taller line to breathe.
const sizes: Record<Size, string> = {
  lg: 'text-[30px] leading-[34px]',
  md: 'text-[21px] leading-[25px]',
  sm: 'text-[15px] leading-[18px]'
};

export function PixelHeading({
  children,
  size = 'md',
  className,
  numberOfLines
}: {
  children: React.ReactNode;
  size?: Size;
  className?: string;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} className={cn('font-pixel text-ink', sizes[size], className)}>
      {children}
    </Text>
  );
}
