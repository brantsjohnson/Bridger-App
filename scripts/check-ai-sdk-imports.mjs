#!/usr/bin/env node
// ============================================
// WHAT THIS FILE DOES (plain English):
// Fails CI if any file outside packages/ai/src/gateway/providers imports the
// Anthropic or OpenAI SDKs. The gateway is the only allowed chokepoint.
// ============================================
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowed = path.join(root, 'packages/ai/src/gateway/providers');

const patterns = ['@anthropic-ai/sdk', "from 'openai'", 'from "openai"'];

let failed = false;
for (const pattern of patterns) {
  let output = '';
  try {
    output = execFileSync(
      'rg',
      [
        '-n',
        '--glob',
        '!**/node_modules/**',
        '--glob',
        '!**/dist/**',
        '--glob',
        '!**/pnpm-lock.yaml',
        '-F',
        pattern,
        root
      ],
      { encoding: 'utf8' }
    );
  } catch (err) {
    // rg exits 1 when no matches.
    const e = err;
    output = typeof e.stdout === 'string' ? e.stdout : '';
  }

  for (const line of output.split('\n').filter(Boolean)) {
    const filePath = line.split(':')[0] ?? '';
    const abs = path.isAbsolute(filePath)
      ? filePath
      : path.join(root, filePath);
    if (abs.startsWith(allowed)) continue;
    if (abs.endsWith('check-ai-sdk-imports.mjs')) continue;
    if (abs.endsWith('package.json')) continue;
    if (abs.includes(`${path.sep}packages${path.sep}ai${path.sep}README.md`)) {
      continue;
    }
    console.error(`Forbidden AI SDK import:\n  ${line}`);
    failed = true;
  }
}

if (failed) {
  console.error(
    '\nOnly packages/ai/src/gateway/providers/** may import Anthropic/OpenAI SDKs.'
  );
  process.exit(1);
}

console.log('AI SDK import ban: ok');
