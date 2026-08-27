import React from 'react'
import { Transition } from 'framer-motion'

/**
 * The only pieces of the Bridger design system the assistant depends on,
 * inlined so this folder can be copied into another repo as-is.
 *
 * Requires: react, framer-motion, lucide-react, tailwindcss, tailwind-merge.
 * See README.md for the handful of Tailwind tokens to add.
 */

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export const gentle: Transition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] }

/** Section heading. Swap for your own type style; only the font differs. */
export function PixelHeading({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={cn('font-pixel text-[15px] leading-none text-ink', className)}>{children}</h2>
  )
}

/** Full-height screen shell. Replace with your own routing container. */
export function Screen({ children }: { children: React.ReactNode }) {
  return <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas">{children}</div>
}

export function ScreenBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-5', className)}>{children}</div>
}
