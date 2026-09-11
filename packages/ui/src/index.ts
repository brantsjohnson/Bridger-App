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
export * from './lib/analytics';
export * from './lib/whimsy';

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
export * from './primitives/FlipCountdown';
export * from './primitives/EmptyState';
export * from './primitives/SectionCount';
export * from './primitives/SectionTitle';
export * from './primitives/InfoPopover';
export * from './primitives/SearchField';
export * from './primitives/Toggle';
export * from './primitives/Badge';
export * from './primitives/ListRow';
export * from './primitives/HobbyEmojiBurst';
export * from './primitives/HobbySelect';
export * from './primitives/ModuleFlow';
export * from './primitives/SegmentedTabs';
export * from './primitives/CollapsibleSection';
export * from './primitives/StorageBar';
export * from './primitives/AudiencePicker';
export * from './primitives/GradientRing';
export * from './primitives/SegmentedProgress';
export * from './primitives/StepProgress';
export * from './primitives/WindowsDialog';
export * from './primitives/NotFoundScreen';
// Scrapbook pages: the 8.5 x 11 page renderer, layout thumbs, and the count pill.
export * from './primitives/ScrapbookPage';
export * from './primitives/SpectrumColorPicker';
export * from './primitives/LayoutCarousel';
export * from './primitives/CountPill';

// --- Layout (the screen scaffold + the floating navigation) ---
// Responsive helpers first so screens can ask "big screen or phone?" anywhere.
export * from './layout/responsive';
export * from './layout/Screen';
export * from './layout/SynthGrid';
export * from './layout/GridColor';
export * from './layout/FloatingTabBar';
export * from './layout/ProfileLink';
