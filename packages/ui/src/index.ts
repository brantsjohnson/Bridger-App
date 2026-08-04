// ============================================
// WHAT THIS FILE DOES (plain English):
// The front door to Bridger's design system. Anything the app imports from
// "@bridger/ui" comes through here: the design tokens, the class-name helper,
// and the ported Magic Patterns primitives + layout pieces. As more components
// get ported, export them here so screens can pull them from one place.
// ============================================

// --- Tokens + helpers ---
export * from './tokens';
export * from './lib/cn';

// --- Primitives (the small reusable building blocks) ---
export * from './primitives/PixelHeading';
export * from './primitives/Card';
export * from './primitives/Chip';
export * from './primitives/Button';
export * from './primitives/Field';
export * from './primitives/Avatar';
export * from './primitives/Cover';
export * from './primitives/Sheet';
export * from './primitives/CountdownChip';
export * from './primitives/EmptyState';
export * from './primitives/SectionCount';
export * from './primitives/SearchField';
export * from './primitives/Toggle';
export * from './primitives/Badge';
export * from './primitives/ListRow';
export * from './primitives/ModuleFlow';
export * from './primitives/SegmentedTabs';
export * from './primitives/CollapsibleSection';
export * from './primitives/StorageBar';

// --- Layout (the screen scaffold + the floating navigation) ---
export * from './layout/Screen';
export * from './layout/SynthGrid';
export * from './layout/FloatingTabBar';
