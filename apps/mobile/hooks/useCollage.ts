// ============================================
// WHAT THIS FILE DOES (plain English):
// A thin name for the collage draft brain. The real work lives in
// useScrapbookDraft (same draft key, same post/delete path) so the camera
// and the editor share one page. New screens should import this name.
// ============================================
export { useScrapbookDraft as useCollage } from './useScrapbookDraft';
export type { MoveTarget } from './useScrapbookDraft';
