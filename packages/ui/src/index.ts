// ============================================
// WHAT THIS FILE DOES (plain English):
// The front door to Bridger's design system. Anything the app imports from
// "@bridger/ui" comes through here. Right now it exposes the design tokens and
// the className helper; the ported Magic Patterns primitives (Button, Card,
// Chip, etc.) get added here as each one is built.
// ============================================
export * from './tokens';
export * from './lib/cn';
