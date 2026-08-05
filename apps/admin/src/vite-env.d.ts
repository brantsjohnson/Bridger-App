// ============================================
// WHAT THIS FILE DOES (plain English):
// Tells TypeScript about Vite's import.meta.env fields we use.
// ============================================
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
