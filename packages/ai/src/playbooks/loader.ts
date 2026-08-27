// ============================================
// WHAT THIS FILE DOES (plain English):
// Finds and reads Bridge playbook markdown. Prefers guide-docs/playbooks on
// disk (same source humans edit). If that folder is missing (slim deploy),
// falls back to a short stub so the agent still names a version.
//
// PRIVACY: playbooks contain zero PII. Never write user content into them.
// ============================================
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  ALL_PLAYBOOK_IDS,
  INTENT_TO_PLAYBOOK,
  type PlaybookDocument,
  type PlaybookId
} from './types';

/** In-memory cache so we do not re-read the same file every turn. */
const cache = new Map<PlaybookId, PlaybookDocument>();

/** Candidate folders: monorepo root, api cwd, nested api dist, etc. */
function candidateDirs(): string[] {
  const cwd = process.cwd();
  return [
    resolve(cwd, 'guide-docs/playbooks'),
    resolve(cwd, '../guide-docs/playbooks'),
    resolve(cwd, '../../guide-docs/playbooks'),
    resolve(cwd, '../../../guide-docs/playbooks'),
    // When Nest runs from apps/api/dist
    resolve(__dirname, '../../../../../guide-docs/playbooks'),
    resolve(__dirname, '../../../../guide-docs/playbooks')
  ];
}

function findPlaybooksDir(): string | null {
  for (const dir of candidateDirs()) {
    try {
      if (existsSync(dir) && existsSync(join(dir, 'event-creation.md'))) {
        return dir;
      }
    } catch {
      // keep looking
    }
  }
  return null;
}

/** Pull "v1" or "v0 stub" from the Version section. */
export function parsePlaybookVersion(body: string): string {
  const match = body.match(/\*\*(v[\w.\- ]+?)\*\*/i);
  if (match?.[1]) return match[1].trim();
  return 'unknown';
}

function stubBody(id: PlaybookId): string {
  return [
    `# playbook: ${id}`,
    '',
    'Stub playbook (guide-docs/playbooks not on disk). Follow AGENT.md invariants:',
    'one question at a time, confirm before write-shared acts, never fabricate.',
    '',
    '## 11 · Version',
    '',
    '- **v0 stub** (embedded fallback)'
  ].join('\n');
}

/**
 * Load one playbook by id. Cached after first read.
 * Returns stub text when markdown files are unavailable.
 */
export function loadPlaybook(id: PlaybookId): PlaybookDocument {
  const hit = cache.get(id);
  if (hit) return hit;

  const dir = findPlaybooksDir();
  let body: string;
  if (dir) {
    const path = join(dir, `${id}.md`);
    try {
      body = readFileSync(path, 'utf8');
    } catch {
      body = stubBody(id);
    }
  } else {
    body = stubBody(id);
  }

  const doc: PlaybookDocument = {
    id,
    version: parsePlaybookVersion(body),
    body
  };
  cache.set(id, doc);
  return doc;
}

/** Pick a playbook from an agent_query intent (or out-of-scope). */
export function playbookForIntent(intent: string | null | undefined): PlaybookDocument {
  const key = (intent ?? 'general').trim();
  const id = INTENT_TO_PLAYBOOK[key] ?? 'friend-questions';
  return loadPlaybook(id);
}

/** List every playbook id that has a file (or the full catalog for stubs). */
export function listPlaybookIds(): PlaybookId[] {
  const dir = findPlaybooksDir();
  if (!dir) return [...ALL_PLAYBOOK_IDS];
  try {
    const names = readdirSync(dir)
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => f.replace(/\.md$/, '') as PlaybookId);
    return names.length ? names : [...ALL_PLAYBOOK_IDS];
  } catch {
    return [...ALL_PLAYBOOK_IDS];
  }
}

/** Clear cache (tests / hot reload). */
export function clearPlaybookCache(): void {
  cache.clear();
}
