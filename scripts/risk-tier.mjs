#!/usr/bin/env node
// ============================================
// WHAT THIS FILE DOES (plain English):
// Looks at the list of files a pull request changed and decides whether the
// PR is "risk:low" (safe to auto-merge when CI is green) or "risk:high"
// (Brant reviews). The rule is by path, not by opinion: if any changed file
// matches a protected pattern below, the PR is high risk. The pattern list
// must stay identical to ops/RISK-TIERS.md.
//
// Usage:
//   node scripts/risk-tier.mjs a/file.ts b/file.ts        (prints low|high)
//   git diff --name-only origin/main | node scripts/risk-tier.mjs --stdin
//   add --json to get {"tier":"high","reasons":[...]}
// ============================================
import fs from 'node:fs';

// --- PROTECTED PATHS: keep in lockstep with ops/RISK-TIERS.md ---
const PROTECTED = [
  'apps/api/src/auth/**',
  'apps/api/src/coop/**',
  'apps/api/src/me/**',
  'apps/api/src/posthog/**',
  'apps/api/src/load-server-secret*',
  'apps/api/src/admin/**',
  'apps/mobile/app/(auth)/**',
  'apps/mobile/app/onboarding/**',
  'apps/mobile/lib/analytics-*.ts',
  'apps/mobile/lib/posthog-sink.ts',
  'apps/mobile/PrivacyInfo.xcprivacy',
  'apps/mobile/app.config.js',
  'apps/mobile/app.json',
  'apps/mobile/eas.json',
  'packages/permissions/**',
  'packages/shared/src/analytics/**',
  'infra/**',
  'supabase/**',
  'guide-docs/docs/PRIVACY.md',
  'guide-docs/docs/TERMS.md',
  'guide-docs/DATA.md',
  'guide-docs/INFRASTRUCTURE.md',
  '.github/**',
  '.cursor/mcp.json',
  '.mcp.json',
  '**/.env*',
  '**/*.sql'
];

// --- SIZE LIMITS: big diffs get eyes even when every path is safe ---
const MAX_FILES = 25;

// THIS SECTION DOES: turn a glob like "apps/api/src/auth/**" into a regex.
function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      // "**/" matches any number of folders (including none); "**" alone matches everything
      if (glob[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') re += '[^/]*';
    else if ('.+?^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}
const MATCHERS = PROTECTED.map((g) => ({ glob: g, re: globToRegex(g) }));

// THIS SECTION DOES: read file names from arguments or from stdin.
const args = process.argv.slice(2);
const json = args.includes('--json');
let files = args.filter((a) => !a.startsWith('--'));
if (args.includes('--stdin')) {
  files = fs.readFileSync(0, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
}

// THIS SECTION DOES: check every file against every protected pattern.
const reasons = [];
for (const f of files) {
  for (const m of MATCHERS) {
    if (m.re.test(f)) {
      reasons.push(`${f} matches protected path ${m.glob}`);
      break;
    }
  }
}
if (files.length > MAX_FILES) reasons.push(`${files.length} files changed (limit ${MAX_FILES} for auto-merge)`);

const tier = reasons.length ? 'high' : 'low';
if (json) console.log(JSON.stringify({ tier, reasons, files: files.length }));
else {
  console.log(tier);
  for (const r of reasons) console.error('  ' + r);
}
