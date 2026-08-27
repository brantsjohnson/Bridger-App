// ============================================
// WHAT THIS FILE DOES (plain English):
// Front door for Bridger analytics — IDs from the taxonomy, the emit client,
// and the shared types. Screens and UI primitives import from here (via
// @bridger/shared) so every event uses the same names.
// ============================================

export * from './types';
export * from './ids';
export * from './sanitize';
export * from './client';
