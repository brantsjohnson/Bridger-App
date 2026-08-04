// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny helper that joins Tailwind class names together, drops any that are
// empty or turned off, and — importantly — lets a later class OVERRIDE an
// earlier conflicting one (via tailwind-merge). That override behavior is what
// makes our components accept a `className` prop that can safely change a
// built-in style, e.g. <Card className="bg-purple"> replaces the default white.
// ============================================
import { twMerge } from 'tailwind-merge';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
