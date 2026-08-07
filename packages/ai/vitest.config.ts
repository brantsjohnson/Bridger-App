// ============================================
// WHAT THIS FILE DOES (plain English):
// Tells Vitest how to run the gateway unit tests and the prompt golden evals.
// ============================================
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'src/evals/**/*.ts']
  }
});
