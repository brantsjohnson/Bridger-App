// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny helper that joins Tailwind class names together and quietly drops any
// that are empty or turned off. Lets components write conditional styles
// cleanly, e.g. cn('p-4', isActive && 'bg-purple').
// ============================================
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
