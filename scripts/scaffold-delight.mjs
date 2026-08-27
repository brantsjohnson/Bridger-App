#!/usr/bin/env node
// ============================================
// WHAT THIS FILE DOES (plain English):
// Creates a new delighter stub folder (effect or standalone plugin) and, for
// plugins, appends a registry entry. Run from the repo root.
// ============================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const delightRoot = path.join(root, 'apps/mobile/delight');

function usage() {
  console.log(`Usage:
  pnpm delight:scaffold -- <slug> --kind standalone|effect --scope gift|global|opt-in --name "Display Name"

Examples:
  pnpm delight:scaffold -- confetti-moment --kind standalone --scope global --name "Confetti moment"
  pnpm delight:scaffold -- sparkle-burst --kind effect --scope global --name "Sparkle burst"
`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kind' || a === '--scope' || a === '--name') {
      args[a.slice(2)] = argv[++i];
    } else if (!a.startsWith('-')) {
      args._.push(a);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const slug = args._[0];
const kind = args.kind;
const scope = args.scope ?? 'global';
const name = args.name ?? slug;

if (!slug || !kind) usage();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Slug must be lowercase kebab-case (e.g. emoji-bomb).');
  process.exit(1);
}
if (!['standalone', 'effect'].includes(kind)) usage();
if (!['gift', 'global', 'opt-in'].includes(scope)) usage();

if (kind === 'effect') {
  const dir = path.join(delightRoot, 'effects', slug);
  if (fs.existsSync(dir)) {
    console.error(`Folder already exists: ${dir}`);
    process.exit(1);
  }
  fs.mkdirSync(dir, { recursive: true });
  const component = slug
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
  fs.writeFileSync(
    path.join(dir, `${component}.tsx`),
    `// ============================================
// WHAT THIS FILE DOES (plain English):
// Reusable delighter effect: ${name}. Import from feature screens.
// Motion: transform/opacity only; respect Reduce Motion.
// ============================================
import React, { useEffect } from 'react';
import { View } from 'react-native';

export type ${component}Props = {
  active: boolean;
  onDone?: () => void;
};

export function ${component}({ active, onDone }: ${component}Props) {
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => onDone?.(), 800);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (!active) return null;
  return <View pointerEvents="none" />;
}
`
  );
  fs.writeFileSync(
    path.join(dir, 'index.ts'),
    `export { ${component} } from './${component}';\nexport type { ${component}Props } from './${component}';\n`
  );
  console.log(`Created effect at apps/mobile/delight/effects/${slug}`);
  console.log('Add a CATALOG.md line when you are ready.');
  process.exit(0);
}

// standalone plugin
const dir = path.join(delightRoot, 'plugins', slug);
if (fs.existsSync(dir)) {
  console.error(`Folder already exists: ${dir}`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
const mountMode = scope === 'opt-in' ? 'persistent' : 'overlay_once';
fs.writeFileSync(
  path.join(dir, 'manifest.ts'),
  `// ============================================
// WHAT THIS FILE DOES (plain English):
// Metadata for the ${name} standalone delighter.
// ============================================

export const MANIFEST = {
  slug: '${slug}',
  name: '${name.replace(/'/g, "\\'")}',
  scope: '${scope}' as const,
  mountMode: '${mountMode}' as const${
    scope === 'gift'
      ? `,\n  attributionTemplate: 'surprise from {name}'`
      : ''
  }
};
`
);
fs.writeFileSync(
  path.join(dir, 'Delight.tsx'),
  `// ============================================
// WHAT THIS FILE DOES (plain English):
// Standalone delighter stub for ${name}. Replace with real motion.
// ============================================
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import type { DelightPluginProps } from '../../registry';

export default function Delight({ attribution, onDone }: DelightPluginProps) {
  useEffect(() => {
    const t = setTimeout(() => onDone(), 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <View pointerEvents="none" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {attribution ? <Text>{attribution}</Text> : null}
    </View>
  );
}
`
);

const registryPath = path.join(delightRoot, 'registry.ts');
let registry = fs.readFileSync(registryPath, 'utf8');
const importLine = `import { MANIFEST as ${slug.replace(/-/g, '_')}Manifest } from './plugins/${slug}/manifest';\n`;
if (!registry.includes(`plugins/${slug}/manifest`)) {
  registry = registry.replace(
    /(import \{ MANIFEST as emojiBombManifest \} from '\.\/plugins\/emoji-bomb\/manifest';\n)/,
    `$1${importLine}`
  );
  const entry = `  {
    slug: ${slug.replace(/-/g, '_')}Manifest.slug,
    scope: ${slug.replace(/-/g, '_')}Manifest.scope,
    mountMode: ${slug.replace(/-/g, '_')}Manifest.mountMode,
    attributionTemplate: ${slug.replace(/-/g, '_')}Manifest.attributionTemplate,
    load: () => import('./plugins/${slug}/Delight')
  }
`;
  registry = registry.replace(
    /export const DELIGHT_REGISTRY: DelightRegistryItem\[\] = \[([\s\S]*?)\];/,
    (match, body) => {
      const trimmed = body.trim().replace(/,\s*$/, '');
      return `export const DELIGHT_REGISTRY: DelightRegistryItem[] = [\n${trimmed},\n${entry}];`;
    }
  );
  fs.writeFileSync(registryPath, registry);
}

console.log(`Created plugin at apps/mobile/delight/plugins/${slug}`);
console.log('Registry updated. Create/enable the matching admin Surprises row with the same slug.');
