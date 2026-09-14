#!/usr/bin/env node
// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny helper for the ops/queue folder so agents (and Brant) do not have to
// hand-edit frontmatter. Four commands:
//   pnpm ops list                      show open items grouped by owner
//   pnpm ops new "Title" --owner cursor --risk low --area mobile --priority p1
//   pnpm ops claim 014 cursor          set owner + status in_progress
//   pnpm ops done 014 --pr <url>       set status done + pr link
// It only touches files in ops/queue. No network, no secrets.
// ============================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- WHERE THE QUEUE LIVES: ops/queue relative to the repo root ---
const here = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(here, '..', 'ops', 'queue');
const TODAY = new Date().toISOString().slice(0, 10);

// THIS SECTION DOES: read the small key: value block at the top of a task file.
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: {}, body: text, raw: '' };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*?)\s*(#.*)?$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: text.slice(m[0].length), raw: m[1] };
}

// THIS SECTION DOES: rewrite one key in the frontmatter, keeping comments.
function setKey(text, key, value) {
  const re = new RegExp(`^(${key}:)([^\\n#]*)(\\s*#.*)?$`, 'm');
  if (re.test(text)) return text.replace(re, (_, k, __, c) => `${k} ${value}${c ? ' ' + c.trim() : ''}`);
  return text.replace(/^---\n/, `---\n${key}: ${value}\n`);
}

// THIS SECTION DOES: list every task file with its parsed frontmatter.
function loadAll() {
  return fs
    .readdirSync(QUEUE)
    .filter((f) => /^\d{3}-.*\.md$/.test(f))
    .sort()
    .map((f) => {
      const text = fs.readFileSync(path.join(QUEUE, f), 'utf8');
      return { file: f, path: path.join(QUEUE, f), text, ...parseFrontmatter(text) };
    });
}

function findById(id) {
  const padded = String(id).padStart(3, '0');
  const item = loadAll().find((t) => t.file.startsWith(padded + '-'));
  if (!item) {
    console.error(`No queue item with id ${padded}`);
    process.exit(1);
  }
  return item;
}

// THIS SECTION DOES: turn "--owner cursor --risk low" into an object.
function flags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1] ?? '';
  }
  return out;
}

const [cmd, ...rest] = process.argv.slice(2);

// --- COMMAND: list ---
if (cmd === 'list' || !cmd) {
  const open = loadAll().filter((t) => !['done', 'dropped'].includes(t.fm.status));
  const byOwner = {};
  for (const t of open) (byOwner[t.fm.owner || 'unassigned'] ||= []).push(t);
  const order = { p0: 0, p1: 1, p2: 2, p3: 3 };
  for (const owner of Object.keys(byOwner).sort()) {
    console.log(`\n== ${owner} ==`);
    byOwner[owner]
      .sort((a, b) => (order[a.fm.priority] ?? 9) - (order[b.fm.priority] ?? 9))
      .forEach((t) =>
        console.log(
          `  ${t.fm.id}  ${(t.fm.priority || '').padEnd(2)}  ${(t.fm.status || '').padEnd(11)}  risk:${(t.fm.risk || '').padEnd(5)}  ${t.fm.title}${t.fm.needs ? `  [needs: ${t.fm.needs}]` : ''}`
        )
      );
  }
  console.log();
}

// --- COMMAND: new ---
else if (cmd === 'new') {
  const title = rest.find((a) => !a.startsWith('--') && rest[rest.indexOf(a) - 1]?.startsWith('--') !== true);
  if (!title) {
    console.error('Usage: pnpm ops new "Title" [--owner x] [--risk low] [--area mobile] [--priority p2]');
    process.exit(1);
  }
  const f = flags(rest);
  const ids = loadAll().map((t) => Number(t.file.slice(0, 3)));
  const id = String((ids.length ? Math.max(...ids) : 0) + 1).padStart(3, '0');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50);
  let text = fs.readFileSync(path.join(QUEUE, '_TEMPLATE.md'), 'utf8');
  text = setKey(text, 'id', id);
  text = setKey(text, 'title', title);
  text = setKey(text, 'owner', f.owner || 'unassigned');
  text = setKey(text, 'risk', f.risk || 'low');
  text = setKey(text, 'area', f.area || 'mobile');
  text = setKey(text, 'priority', f.priority || 'p2');
  text = setKey(text, 'created', TODAY);
  text = setKey(text, 'updated', TODAY);
  const out = path.join(QUEUE, `${id}-${slug}.md`);
  fs.writeFileSync(out, text);
  console.log(`Created ops/queue/${id}-${slug}.md (owner: ${f.owner || 'unassigned'})`);
}

// --- COMMAND: claim ---
else if (cmd === 'claim') {
  const [id, owner] = rest;
  if (!id || !owner) {
    console.error('Usage: pnpm ops claim <id> <owner>');
    process.exit(1);
  }
  const item = findById(id);
  let text = setKey(item.text, 'owner', owner);
  text = setKey(text, 'status', 'in_progress');
  text = setKey(text, 'updated', TODAY);
  fs.writeFileSync(item.path, text);
  console.log(`${item.file}: owner=${owner} status=in_progress`);
}

// --- COMMAND: done ---
else if (cmd === 'done') {
  const [id] = rest;
  const f = flags(rest);
  const item = findById(id);
  let text = setKey(item.text, 'status', 'done');
  text = setKey(text, 'updated', TODAY);
  if (f.pr) text = setKey(text, 'pr', f.pr);
  fs.writeFileSync(item.path, text);
  console.log(`${item.file}: status=done${f.pr ? ` pr=${f.pr}` : ''}`);
}

// --- ANYTHING ELSE: print help ---
else {
  console.log('Commands: list | new "Title" [--owner --risk --area --priority] | claim <id> <owner> | done <id> [--pr url]');
}
