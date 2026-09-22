// ============================================
// WHAT THIS FILE DOES (plain English):
// Reads every SQL migration in infra/supabase/migrations and every Nest
// route under apps/api, then writes a machine-readable snapshot of Bridger's
// data layer. Phase 0 of the data-rails plan uses this snapshot so later
// phases cite real tables, policies, and routes.
//
// It does not connect to a live database and it does not print secrets.
// Run from the repo root: node scripts/data-inventory/generate.mjs
// ============================================

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const MIGRATIONS_DIR = path.join(ROOT, 'infra/supabase/migrations');
const API_SRC = path.join(ROOT, 'apps/api/src');
const MOBILE_SRC = path.join(ROOT, 'apps/mobile');
const TYPES_FILE = path.join(ROOT, 'packages/shared/src/database.types.ts');
const OUT_DIR = path.join(ROOT, 'guide-docs/platform/inventory');

// THIS SECTION DOES: turn a SQL file into statements, keeping function bodies intact.
function splitStatements(sql) {
  const stmts = [];
  let buf = '';
  let i = 0;
  let paren = 0;
  let dollar = null;
  let inSingle = false;

  while (i < sql.length) {
    if (!inSingle && !dollar && sql[i] === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl + 1;
      buf += '\n';
      continue;
    }
    if (!dollar && sql[i] === "'") {
      if (inSingle && sql[i + 1] === "'") {
        buf += "''";
        i += 2;
        continue;
      }
      inSingle = !inSingle;
      buf += sql[i++];
      continue;
    }
    if (inSingle) {
      buf += sql[i++];
      continue;
    }
    if (!dollar && sql[i] === '$') {
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) {
        dollar = m[0];
        buf += m[0];
        i += m[0].length;
        continue;
      }
    }
    if (dollar && sql.startsWith(dollar, i)) {
      buf += dollar;
      i += dollar.length;
      dollar = null;
      continue;
    }
    if (!dollar) {
      if (sql[i] === '(') paren += 1;
      else if (sql[i] === ')') paren -= 1;
      else if (paren === 0 && sql[i] === ';') {
        const s = buf.trim();
        if (s) stmts.push(s);
        buf = '';
        i += 1;
        continue;
      }
    }
    buf += sql[i++];
  }
  const tail = buf.trim();
  if (tail) stmts.push(tail);
  return stmts;
}

// THIS SECTION DOES: split a comma list without breaking nested parentheses.
function splitComma(text) {
  const parts = [];
  let buf = '';
  let depth = 0;
  let inSingle = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" && text[i - 1] !== '\\') {
      if (inSingle && text[i + 1] === "'") {
        buf += "''";
        i += 1;
        continue;
      }
      inSingle = !inSingle;
      buf += ch;
      continue;
    }
    if (!inSingle) {
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (ch === ',' && depth === 0) {
        if (buf.trim()) parts.push(buf.trim());
        buf = '';
        continue;
      }
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function qualName(raw) {
  const m = raw.trim().match(/^(?:(public|auth|storage)\.)?([a-zA-Z_][\w]*)$/);
  if (!m) return { schema: 'public', name: raw.trim().replace(/"/g, '') };
  return { schema: m[1] || 'public', name: m[2] };
}

function extractType(rest) {
  const stop = /^(not|null|default|primary|unique|references|check|constraint|collate|generated)$/i;
  let i = 0;
  let depth = 0;
  while (i < rest.length) {
    const ch = rest[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (depth === 0 && /[A-Za-z_]/.test(ch)) {
      const word = rest.slice(i).match(/^[A-Za-z_]+/)[0];
      if (stop.test(word)) break;
    }
    i += 1;
  }
  return rest.slice(0, i).trim().replace(/\s+/g, ' ');
}

function parseColumnClause(clause) {
  const m = clause.match(/^("?[A-Za-z_][\w]*"?)\s+([\s\S]+)$/);
  if (!m) return null;
  const name = m[1].replace(/"/g, '');
  const rest = m[2].trim();
  if (/^(constraint|primary|unique|foreign|check|exclude)\b/i.test(name) && !rest) {
    return null;
  }
  const type = extractType(rest);
  if (!type || /^(constraint|primary|unique|check|foreign|exclude)$/i.test(name)) {
    return null;
  }
  const ref = rest.match(
    /references\s+((?:public|auth)\.)?([a-zA-Z_][\w]*)\s*\(\s*([^)]+?)\s*\)/i
  );
  const notNull = /\bnot\s+null\b/i.test(rest);
  const pk = /\bprimary\s+key\b/i.test(rest);
  const def = rest.match(/\bdefault\s+([\s\S]+?)(?=\s+(?:primary|unique|references|check|constraint)\b|$)/i);
  return {
    name,
    type,
    nullable: pk || notNull ? false : true,
    primary_key: pk,
    default: def ? def[1].trim() : null,
    references: ref
      ? {
          schema: ref[1] ? ref[1].replace('.', '') : 'public',
          table: ref[2],
          column: ref[3].trim()
        }
      : null,
    on_delete: (rest.match(/\bon\s+delete\s+(cascade|set\s+null|restrict|set\s+default|no\s+action)/i) || [])[1]
      ?.replace(/\s+/g, ' ') || null,
    raw: clause.replace(/\s+/g, ' ')
  };
}

function tableBody(sql) {
  const open = sql.indexOf('(');
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < sql.length; i += 1) {
    if (sql[i] === '(') depth += 1;
    else if (sql[i] === ')') {
      depth -= 1;
      if (depth === 0) return sql.slice(open + 1, i);
    }
  }
  return null;
}

function ensureTable(tables, schema, name, file) {
  const key = `${schema}.${name}`;
  if (!tables.has(key)) {
    tables.set(key, {
      schema,
      name,
      key,
      created_in: file,
      columns: [],
      constraints: [],
      indexes: [],
      triggers: [],
      policies: [],
      rls_enabled: false,
      rls_forced: false,
      comments: []
    });
  }
  return tables.get(key);
}

function addColumn(table, col, file) {
  const existing = table.columns.find((c) => c.name === col.name);
  if (existing) {
    Object.assign(existing, col, { added_in: existing.added_in || file });
    return;
  }
  table.columns.push({ ...col, added_in: file });
}

function applyTableConstraint(table, clause, file) {
  table.constraints.push({ raw: clause.replace(/\s+/g, ' '), added_in: file });
  const fk = clause.match(
    /foreign\s+key\s*\(\s*([^)]+?)\s*\)\s*references\s+((?:public|auth)\.)?([a-zA-Z_][\w]*)\s*\(\s*([^)]+?)\s*\)/i
  );
  if (!fk) return;
  const cols = fk[1].split(',').map((c) => c.trim());
  const onDelete = (clause.match(/\bon\s+delete\s+(cascade|set\s+null|restrict|set\s+default|no\s+action)/i) || [])[1];
  for (const colName of cols) {
    const col = table.columns.find((c) => c.name === colName);
    if (!col) continue;
    col.references = {
      schema: fk[2] ? fk[2].replace('.', '') : 'public',
      table: fk[3],
      column: fk[4].trim()
    };
    if (onDelete) col.on_delete = onDelete.replace(/\s+/g, ' ');
  }
  const pk = clause.match(/primary\s+key\s*\(\s*([^)]+?)\s*\)/i);
  if (pk) {
    for (const colName of pk[1].split(',').map((c) => c.trim())) {
      const col = table.columns.find((c) => c.name === colName);
      if (col) {
        col.primary_key = true;
        col.nullable = false;
      }
    }
  }
}

function parsePolicy(sql, file) {
  const m = sql.match(
    /^create\s+policy\s+("?[\w]+"?)\s+on\s+((?:public|storage)\.)?([a-zA-Z_][\w]*)([\s\S]*)$/i
  );
  if (!m) return null;
  const rest = m[4];
  const command = (rest.match(/\bfor\s+(select|insert|update|delete|all)\b/i) || [])[1] || null;
  const rolesRaw = (rest.match(/\bto\s+([a-zA-Z0-9_,\s]+?)(?=\s+(?:using|with|for)\b|$)/i) || [])[1];
  const using = (rest.match(/\busing\s*(\([\s\S]*\))(?:\s+with\s+check\b|$)/i) || [])[1] || null;
  const check = (rest.match(/\bwith\s+check\s*(\([\s\S]*\))\s*$/i) || [])[1] || null;
  const norm = (s) => (s || '').replace(/^\(/, '').replace(/\)$/, '').trim().replace(/\s+/g, ' ');
  const usingNorm = norm(using);
  const checkNorm = norm(check);
  const permissive =
    usingNorm.toLowerCase() === 'true' || checkNorm.toLowerCase() === 'true';
  return {
    name: m[1].replace(/"/g, ''),
    schema: m[2] ? m[2].replace('.', '') : 'public',
    table: m[3],
    command: command ? command.toLowerCase() : 'all (postgres default: FOR omitted)',
    roles: rolesRaw ? rolesRaw.split(',').map((r) => r.trim()).filter(Boolean) : [],
    using: usingNorm || null,
    with_check: checkNorm || null,
    permissive_true: permissive,
    includes_anon: rolesRaw ? /\banon\b/i.test(rolesRaw) : false,
    sql: sql.replace(/\s+/g, ' ').trim(),
    defined_in: file
  };
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) acc.push(full);
  }
  return acc;
}

// THIS SECTION DOES: pull Nest routes and the guards sitting on them.
function guardNames(decorators) {
  return decorators
    .filter((d) => d.startsWith('@UseGuards'))
    .map((d) => (d.match(/@UseGuards\(([^)]*)\)/) || [])[1] || '')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function httpDecorator(decorators) {
  const line = decorators.find((d) => /^@(Get|Post|Put|Patch|Delete)\(/.test(d));
  if (!line) return null;
  const m = line.match(/^@(Get|Post|Put|Patch|Delete)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/);
  if (!m) return null;
  return { verb: m[1].toUpperCase(), sub: m[2] || '' };
}

// THIS SECTION DOES: pair each route decorator cluster with the guards on that method.
function parseControllers(files) {
  const routes = [];
  for (const file of files) {
    if (!file.endsWith('.controller.ts')) continue;
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    const lines = src.split('\n');
    const classLine = lines.findIndex((line) => /export\s+class\s+/.test(line));
    const before = lines.slice(0, Math.max(classLine, 0)).join('\n');
    const classGuards = guardNames([...before.matchAll(/@UseGuards\([^)]*\)/g)].map((m) => m[0]));
    const controller = (before.match(/@Controller\(\s*['"`]([^'"`]*)['"`]\s*\)/) || [])[1] ?? '';
    let cluster = [];
    for (const line of lines.slice(Math.max(classLine, 0) + 1)) {
      const trim = line.trim();
      if (trim.startsWith('@')) {
        cluster.push(trim);
        continue;
      }
      if (!trim || trim.startsWith('//') || trim.startsWith('*') || trim.startsWith('/*')) continue;
      const http = httpDecorator(cluster);
      const isMethod = /^(public |private |protected )?(async )?[A-Za-z_][\w]*\s*\(/.test(trim);
      if (http && isMethod) {
        const methodGuards = guardNames(cluster);
        const pathPart = [controller, http.sub].filter((p) => p !== '').join('/');
        routes.push({
          method: http.verb,
          path: `/${pathPart}`.replace(/\/+/g, '/'),
          guards: [...new Set([...classGuards, ...methodGuards])],
          file: rel
        });
      }
      cluster = [];
    }
  }
  return routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function parseFromCalls(files) {
  const calls = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    const re = /\.from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g;
    let match;
    while ((match = re.exec(src))) {
      const line = src.slice(0, match.index).split('\n').length;
      const around = src.slice(Math.max(0, match.index - 180), match.index + 80);
      const viaAdmin = /supabase\.admin\s*$/.test(around.replace(/\s+/g, ' ').slice(-40)) ||
        around.includes('this.supabase.admin') ||
        around.includes('supabase.admin');
      calls.push({ table: match[1], file: rel, line, via_service_role_client: viaAdmin || rel.startsWith('apps/api/') });
    }
    const rpc = /\.rpc\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g;
    while ((match = rpc.exec(src))) {
      const line = src.slice(0, match.index).split('\n').length;
      calls.push({
        table: null,
        rpc: match[1],
        file: rel,
        line,
        via_service_role_client: rel.startsWith('apps/api/')
      });
    }
  }
  return calls;
}

function parseMobileDirect(files) {
  const hits = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes('supabase')) continue;
    const rel = path.relative(ROOT, file);
    const re = /supabase(?:\s*\.\s*|\s*\n\s*\.)(auth|storage|from|rpc)\b/g;
    let match;
    while ((match = re.exec(src))) {
      const line = src.slice(0, match.index).split('\n').length;
      let detail = match[1];
      if (match[1] === 'from') {
        const rest = src.slice(match.index, match.index + 80);
        const name = rest.match(/from\(\s*['"`]([^'"`]+)['"`]/);
        detail = name ? `from('${name[1]}')` : 'from(?)';
      } else if (match[1] === 'storage') {
        const rest = src.slice(match.index, match.index + 120);
        const bucket = rest.match(/from\(\s*['"`]([^'"`]+)['"`]/);
        detail = bucket ? `storage.from('${bucket[1]}')` : 'storage';
      } else if (match[1] === 'auth') {
        const rest = src.slice(match.index, match.index + 80);
        const method = rest.match(/auth\.(\w+)/);
        detail = method ? `auth.${method[1]}` : 'auth';
      }
      hits.push({ file: rel, line, call: detail });
    }
  }
  return hits;
}

function generatedTableNames(typesSrc) {
  const start = typesSrc.indexOf('Tables: {');
  const end = typesSrc.indexOf('Views:', start);
  if (start < 0 || end < 0) return [];
  const block = typesSrc.slice(start, end);
  return [...block.matchAll(/^      ([a-z0-9_]+): \{$/gm)].map((m) => m[1]);
}

function generatedEnums(typesSrc) {
  const start = typesSrc.indexOf('    Enums: {');
  const end = typesSrc.indexOf('    CompositeTypes:', start);
  if (start < 0 || end < 0) return [];
  const block = typesSrc.slice(start, end);
  return [...block.matchAll(/^      ([a-z0-9_]+):/gm)].map((m) => m[1]);
}

// THIS SECTION DOES: provisional sensitivity labels. Unsure columns go up, not down.
function classifyColumn(tableName, col) {
  const n = col.name.toLowerCase();
  const t = tableName.toLowerCase();
  // Match whole tokens so "platform" and "latency_ms" are not treated as location.
  const sensitiveCols =
    /(^|_)(phone|email|e164|allerg|birthday|birth|geo|address|city|secret|password|handle)($|_)|_token$|token_enc/;
  const tokenTables = new Set(['invite_links', 'qr_tokens', 'jname_shares', 'music_oauth_states']);

  if (['id', 'created_at', 'updated_at'].includes(n) && !sensitiveCols.test(t)) {
    return {
      sensitivity_class: 'system_internal',
      needs_review: false,
      rule: 'row bookkeeping'
    };
  }
  if (t === 'pending_people' || t === 'user_contacts') {
    return { sensitivity_class: 'sensitive', needs_review: false, rule: 'contact PII table' };
  }
  if (t === 'music_connections' && /token|secret|provider_user/.test(n)) {
    return { sensitivity_class: 'sensitive', needs_review: false, rule: 'oauth secret' };
  }
  if (sensitiveCols.test(n)) {
    if (tokenTables.has(t) && n === 'token') {
      return {
        sensitivity_class: 'private',
        needs_review: true,
        rule: 'capability token, classified up from public'
      };
    }
    return {
      sensitivity_class: 'sensitive',
      needs_review: /city|address|token|geo/.test(n),
      rule: 'column name looks like contact, location, health, or a secret'
    };
  }
  if (n === 'social_battery' || n.includes('allerg') || n === 'met_place_label') {
    return {
      sensitivity_class: 'sensitive',
      needs_review: true,
      rule: 'location, health, or self-reported energy. Classified up until reviewed.'
    };
  }
  if ((t === 'attributes' && n === 'value') || n === 'onboarding_draft') {
    return {
      sensitivity_class: 'sensitive',
      needs_review: true,
      rule: 'json bag can hold birthday, job, and other facts. Class depends on the key inside.'
    };
  }
  if (t === 'user_identity' && /avatar|display_name|profile_song/.test(n)) {
    return {
      sensitivity_class: n.includes('avatar') ? 'sensitive' : 'friends_only',
      needs_review: true,
      rule: 'likeness and public-face fields classified up'
    };
  }
  if (/embedding|summary|transcript/.test(n) || /embeddings|summaries/.test(t)) {
    return {
      sensitivity_class: 'private',
      needs_review: true,
      rule: 'derived personal data, classified up'
    };
  }
  if (t.startsWith('assistant_') || t === 'friend_notes' || t === 'blocks') {
    return { sensitivity_class: 'private', needs_review: true, rule: 'private-by-product table' };
  }
  if (t.startsWith('ai_') || t === 'admin_config' || t === 'matching_config' || t === 'billy_config') {
    return {
      sensitivity_class: 'system_internal',
      needs_review: /user|owner|author/.test(n),
      rule: 'operator or model config'
    };
  }
  if (n === 'visible_to_tier' || n === 'matchable' || n === 'audience_tier') {
    return {
      sensitivity_class: 'private',
      needs_review: true,
      rule: 'consent flag on the row, not the fact itself'
    };
  }
  return {
    sensitivity_class: 'private',
    needs_review: true,
    rule: 'default classify-up until a human assigns a catalog class'
  };
}

function ownerSubject(tableName, columns) {
  const names = new Set(columns.map((c) => c.name));
  const subjects = [];
  if (names.has('owner_id')) subjects.push('row owner (owner_id)');
  if (names.has('author_id')) subjects.push('author (author_id)');
  if (names.has('user_id') && !names.has('owner_id') && !names.has('author_id')) {
    subjects.push('row user (user_id)');
  }
  if (names.has('user_a') && names.has('user_b')) subjects.push('both parties (user_a, user_b)');
  if (names.has('other_id')) subjects.push('the other person (other_id)');
  if (names.has('quoted_person_id')) subjects.push('quoted person (quoted_person_id)');
  if (names.has('tagged_user_id')) subjects.push('tagged person (tagged_user_id)');
  if (names.has('blocked_id') || names.has('blocker_id')) subjects.push('both people on the block');
  if (tableName === 'pending_people') {
    subjects.push('author', 'the person named by phone_e164 (may not have an account)');
  }
  if (subjects.length === 0) subjects.push('not found: no obvious owner column');
  return subjects;
}

function main() {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const dupPrefixes = {};
  for (const f of files) {
    const prefix = f.slice(0, 4);
    dupPrefixes[prefix] = dupPrefixes[prefix] || [];
    dupPrefixes[prefix].push(f);
  }

  const tables = new Map();
  const enums = new Map();
  const functions = new Map();
  const triggers = [];
  const extensions = [];
  const grants = [];
  const seeds = [];
  const unparsed = [];
  const dropped = [];

  function handleStatement(sql, file) {
    const flat = sql.replace(/\s+/g, ' ').trim();
    const head = flat.slice(0, 80).toLowerCase();

    if (/^do\s+\$/i.test(flat)) {
      const bodyMatch = sql.match(/\$[A-Za-z0-9_]*\$([\s\S]*)\$[A-Za-z0-9_]*\$/);
      if (bodyMatch) {
        for (const inner of splitStatements(bodyMatch[1])) handleStatement(inner, file);
      }
      return;
    }

    if (/^create\s+extension\b/i.test(flat)) {
      extensions.push({ sql: flat, file });
      return;
    }

    if (/^create\s+type\s+/i.test(flat)) {
      const m = flat.match(/^create\s+type\s+(?:public\.)?(\w+)\s+as\s+enum\s*\(([^)]*)\)/i);
      if (m) {
        const values = [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]);
        enums.set(m[1], { name: m[1], values, created_in: file });
      } else unparsed.push({ file, kind: 'create type', sql: flat.slice(0, 240) });
      return;
    }

    if (/^alter\s+type\s+/i.test(flat)) {
      const m = flat.match(
        /^alter\s+type\s+(?:public\.)?(\w+)\s+add\s+value\s+(?:if\s+not\s+exists\s+)?'([^']+)'/i
      );
      if (m) {
        const en = enums.get(m[1]) || { name: m[1], values: [], created_in: file };
        if (!en.values.includes(m[2])) en.values.push(m[2]);
        enums.set(m[1], en);
      } else unparsed.push({ file, kind: 'alter type', sql: flat.slice(0, 240) });
      return;
    }

    if (/^create\s+table\b/i.test(flat)) {
      const m = flat.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?((?:public|auth)\.)?([a-zA-Z_][\w]*)/i);
      if (!m) {
        unparsed.push({ file, kind: 'create table', sql: flat.slice(0, 240) });
        return;
      }
      const schema = m[1] ? m[1].replace('.', '') : 'public';
      const table = ensureTable(tables, schema, m[2], file);
      const body = tableBody(sql);
      if (!body) return;
      for (const part of splitComma(body)) {
        if (/^(constraint|primary\s+key|unique|check|foreign\s+key|exclude)\b/i.test(part)) {
          applyTableConstraint(table, part, file);
          continue;
        }
        const col = parseColumnClause(part);
        if (col) addColumn(table, col, file);
        else table.constraints.push({ raw: part.replace(/\s+/g, ' '), added_in: file });
      }
      return;
    }

    if (/^alter\s+table\b/i.test(flat)) {
      const m = flat.match(
        /^alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?((?:public|auth)\.)?([a-zA-Z_][\w]*)\s+([\s\S]+)$/i
      );
      if (!m) {
        unparsed.push({ file, kind: 'alter table', sql: flat.slice(0, 240) });
        return;
      }
      const schema = m[1] ? m[1].replace('.', '') : 'public';
      const table = ensureTable(tables, schema, m[2], file);
      const actions = splitComma(m[3]);
      for (const action of actions) {
        if (/^enable\s+row\s+level\s+security\b/i.test(action)) {
          table.rls_enabled = true;
          continue;
        }
        if (/^force\s+row\s+level\s+security\b/i.test(action)) {
          table.rls_forced = true;
          continue;
        }
        if (/^disable\s+row\s+level\s+security\b/i.test(action)) {
          table.rls_enabled = false;
          table.rls_disabled_in = file;
          continue;
        }
        const add = action.match(/^add\s+column\s+(?:if\s+not\s+exists\s+)?([a-zA-Z_][\w]*)\s+([\s\S]+)$/i);
        if (add) {
          const col = parseColumnClause(`${add[1]} ${add[2]}`);
          if (col) addColumn(table, col, file);
          else unparsed.push({ file, kind: 'add column', sql: action.slice(0, 240) });
          continue;
        }
        const dropCol = action.match(/^drop\s+column\s+(?:if\s+exists\s+)?([a-zA-Z_][\w]*)/i);
        if (dropCol) {
          table.columns = table.columns.filter((c) => c.name !== dropCol[1]);
          dropped.push({ kind: 'column', table: table.key, name: dropCol[1], file });
          continue;
        }
        const alterCol = action.match(/^alter\s+column\s+([a-zA-Z_][\w]*)\s+([\s\S]+)$/i);
        if (alterCol) {
          const col = table.columns.find((c) => c.name === alterCol[1]);
          const change = alterCol[2];
          if (col && /set\s+default\s+/i.test(change)) {
            col.default = change.replace(/^set\s+default\s+/i, '').trim();
            col.default_set_in = file;
          }
          if (col && /set\s+not\s+null/i.test(change)) col.nullable = false;
          if (col && /drop\s+not\s+null/i.test(change)) col.nullable = true;
          if (col && /type\s+/i.test(change)) {
            const tm = change.match(/\btype\s+([\s\S]+?)(?=\s+using\b|$)/i);
            if (tm) col.type = tm[1].trim();
          }
          table.constraints.push({ raw: action.replace(/\s+/g, ' '), added_in: file });
          continue;
        }
        if (/^add\s+constraint\b/i.test(action) || /^drop\s+constraint\b/i.test(action)) {
          if (/^add\s+constraint\b/i.test(action)) applyTableConstraint(table, action, file);
          else table.constraints.push({ raw: action.replace(/\s+/g, ' '), added_in: file });
          continue;
        }
        unparsed.push({ file, kind: 'alter action', sql: action.slice(0, 240) });
      }
      return;
    }

    if (/^create\s+(unique\s+)?index\b/i.test(flat)) {
      const m = flat.match(
        /^create\s+(unique\s+)?index\s+(?:if\s+not\s+exists\s+)?(\w+)\s+on\s+(?:public\.)?([a-zA-Z_][\w]*)\b/i
      );
      if (!m) {
        unparsed.push({ file, kind: 'create index', sql: flat.slice(0, 240) });
        return;
      }
      const table = ensureTable(tables, 'public', m[3], file);
      const open = sql.search(/\bon\s+(?:public\.)?[a-zA-Z_][\w]*\b/i);
      const parenAt = sql.indexOf('(', open);
      let depth = 0;
      let end = parenAt;
      for (let i = parenAt; i < sql.length; i += 1) {
        if (sql[i] === '(') depth += 1;
        else if (sql[i] === ')') {
          depth -= 1;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      const cols = sql.slice(parenAt + 1, end).replace(/\s+/g, ' ').trim();
      const where = (sql.slice(end + 1).match(/\bwhere\s+([\s\S]+)$/i) || [])[1];
      table.indexes.push({
        name: m[2],
        unique: Boolean(m[1]),
        columns: cols,
        where: where ? where.replace(/\s+/g, ' ').trim() : null,
        defined_in: file
      });
      return;
    }

    if (/^create\s+policy\b/i.test(flat)) {
      const policy = parsePolicy(sql, file);
      if (!policy) {
        unparsed.push({ file, kind: 'create policy', sql: flat.slice(0, 300) });
        return;
      }
      const table = ensureTable(tables, policy.schema, policy.table, file);
      table.policies = table.policies.filter((p) => p.name !== policy.name);
      table.policies.push(policy);
      return;
    }

    if (/^drop\s+policy\b/i.test(flat)) {
      const m = flat.match(/^drop\s+policy\s+(?:if\s+exists\s+)?(\w+)\s+on\s+(?:public\.)?([a-zA-Z_][\w]*)/i);
      if (m) {
        const table = tables.get(`public.${m[2]}`);
        if (table) table.policies = table.policies.filter((p) => p.name !== m[1]);
        dropped.push({ kind: 'policy', name: m[1], table: m[2], file });
      }
      return;
    }

    if (/^create\s+(or\s+replace\s+)?function\b/i.test(flat)) {
      const m = flat.match(/^create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-zA-Z_][\w]*)\s*\(/i);
      if (!m) {
        unparsed.push({ file, kind: 'create function', sql: flat.slice(0, 200) });
        return;
      }
      functions.set(m[1], {
        name: m[1],
        security_definer: /security\s+definer/i.test(sql),
        search_path: (sql.match(/set\s+search_path\s*=\s*([^\s]+)/i) || [])[1] || null,
        returns: (flat.match(/\breturns\s+([a-zA-Z0-9_\[\]]+)/i) || [])[1] || null,
        defined_in: file,
        sql: flat.slice(0, 500)
      });
      return;
    }

    if (/^drop\s+function\b/i.test(flat)) {
      const m = flat.match(/^drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?([a-zA-Z_][\w]*)/i);
      if (m) {
        functions.delete(m[1]);
        dropped.push({ kind: 'function', name: m[1], file });
      }
      return;
    }

    if (/^create\s+trigger\b/i.test(flat)) {
      const m = flat.match(
        /^create\s+trigger\s+(\w+)\s+(before|after|instead\s+of)\s+([\w\s]+?)\s+on\s+((?:public|auth)\.)?([a-zA-Z_][\w]*)/i
      );
      if (!m) {
        unparsed.push({ file, kind: 'create trigger', sql: flat.slice(0, 240) });
        return;
      }
      const schema = m[4] ? m[4].replace('.', '') : 'public';
      const fn = (flat.match(/execute\s+(?:function|procedure)\s+(?:public\.)?([a-zA-Z_][\w]*)/i) || [])[1];
      const row = {
        name: m[1],
        timing: m[2].toLowerCase(),
        events: m[3].trim().toLowerCase(),
        schema,
        table: m[5],
        function: fn || null,
        defined_in: file,
        sql: flat
      };
      const idx = triggers.findIndex((t) => t.name === row.name && t.table === row.table && t.schema === schema);
      if (idx >= 0) triggers[idx] = row;
      else triggers.push(row);
      if (schema === 'public') {
        const table = ensureTable(tables, schema, m[5], file);
        table.triggers = table.triggers.filter((t) => t.name !== row.name);
        table.triggers.push(row);
      }
      return;
    }

    if (/^drop\s+trigger\b/i.test(flat)) {
      const m = flat.match(/^drop\s+trigger\s+(?:if\s+exists\s+)?(\w+)\s+on\s+((?:public|auth)\.)?([a-zA-Z_][\w]*)/i);
      if (m) {
        const schema = m[2] ? m[2].replace('.', '') : 'public';
        const keep = triggers.filter((t) => !(t.name === m[1] && t.table === m[3] && t.schema === schema));
        triggers.length = 0;
        triggers.push(...keep);
        const table = tables.get(`${schema}.${m[3]}`);
        if (table) table.triggers = table.triggers.filter((t) => t.name !== m[1]);
      }
      return;
    }

    if (/^comment\s+on\b/i.test(flat)) {
      const m = flat.match(/^comment\s+on\s+(table|column)\s+(?:public\.)?([a-zA-Z_][\w]*)(?:\.([a-zA-Z_][\w]*))?\s+is\s+'([\s\S]*)'$/i);
      if (m) {
        const table = tables.get(`public.${m[2]}`);
        if (table) table.comments.push({ kind: m[1], column: m[3] || null, text: m[4], file });
      }
      return;
    }

    if (/^(grant|revoke)\b/i.test(flat)) {
      grants.push({ sql: flat, file });
      return;
    }

    if (/^insert\s+into\b/i.test(flat)) {
      const m = flat.match(/^insert\s+into\s+(?:public\.)?([a-zA-Z_][\w]*)/i);
      if (m) seeds.push({ table: m[1], file });
      return;
    }

    if (/^(update|delete\s+from|select|notify|set\s+)\b/i.test(flat)) return;

    if (/^(create|alter|drop)\b/i.test(flat)) {
      unparsed.push({ file, kind: head.split(' ').slice(0, 3).join(' '), sql: flat.slice(0, 300) });
    }
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const stmt of splitStatements(sql)) handleStatement(stmt, file);
  }

  const tableList = [...tables.values()].sort((a, b) => a.key.localeCompare(b.key));
  const policies = tableList.flatMap((t) => t.policies.map((p) => ({ ...p, table_key: t.key })));
  const rlsOff = tableList.filter((t) => t.schema === 'public' && !t.rls_enabled);
  const rlsOnNoPolicy = tableList.filter((t) => t.rls_enabled && t.policies.length === 0);
  const permissive = policies.filter((p) => p.permissive_true);

  const typesSrc = fs.readFileSync(TYPES_FILE, 'utf8');
  const typedTables = new Set(generatedTableNames(typesSrc));
  const typedEnums = new Set(generatedEnums(typesSrc));
  const migrationTables = tableList.filter((t) => t.schema === 'public').map((t) => t.name);
  const missingFromTypes = migrationTables.filter((n) => !typedTables.has(n)).sort();
  const extraInTypes = [...typedTables].filter((n) => !migrationTables.includes(n)).sort();
  const missingEnums = [...enums.keys()].filter((n) => !typedEnums.has(n)).sort();

  const apiFiles = walk(API_SRC);
  const mobileFiles = walk(MOBILE_SRC);
  const routes = parseControllers(apiFiles);
  const fromCalls = parseFromCalls(apiFiles);
  const mobileDirect = parseMobileDirect(mobileFiles);

  const byModule = {};
  for (const call of fromCalls) {
    const parts = call.file.split(path.sep);
    const mod = parts[2] === 'src' ? parts[3] : parts[2];
    byModule[mod] = byModule[mod] || { tables: {}, rpcs: [], files: new Set() };
    byModule[mod].files.add(call.file);
    if (call.rpc) byModule[mod].rpcs.push(call.rpc);
    else byModule[mod].tables[call.table] = (byModule[mod].tables[call.table] || 0) + 1;
  }
  const routesByFile = {};
  for (const route of routes) {
    const parts = route.file.split(path.sep);
    const mod = parts[3];
    routesByFile[mod] = routesByFile[mod] || [];
    routesByFile[mod].push(route);
  }

  const catalog = [];
  for (const table of tableList) {
    if (table.schema !== 'public') continue;
    const subjects = ownerSubject(table.name, table.columns);
    for (const col of table.columns) {
      const cls = classifyColumn(table.name, col);
      catalog.push({
        id: `public.${table.name}.${col.name}`,
        entity: table.name,
        field: col.name,
        type: col.type,
        nullable: col.nullable,
        since_version: col.added_in,
        deprecated_in: null,
        owner_subject: subjects,
        sensitivity_class: cls.sensitivity_class,
        needs_review: cls.needs_review,
        classification_rule: cls.rule,
        purpose_tags: [],
        allowed_operations: [],
        derivable_to: [],
        consent_basis: null,
        retention: null,
        deletion_cascade: col.on_delete || null,
        export_included: null,
        visibility_default: null,
        provenance: 'core',
        lineage: null,
        references: col.references,
        primary_key: col.primary_key
      });
    }
  }

  const derived = [
    {
      field: 'public.person_embeddings.embedding',
      lineage: 'attributes rows with matchable=true (Zone B). See guide-docs/DATA.md zone C.'
    },
    {
      field: 'public.person_summaries.summary',
      lineage: 'de-identified text built from matchable attributes. Not found as a column name in this note if the column is named differently: check the table columns.'
    },
    {
      field: 'public.day_summaries',
      lineage: 'AI text from the author update_text plus transcript. Words only.'
    },
    {
      field: 'public.week_summaries',
      lineage: 'AI week text. Words only.'
    },
    {
      field: 'public.stories.transcript',
      lineage: 'speech-to-text of the author media. Derived from the story the author posted.'
    },
    {
      field: 'public.quiz_results',
      lineage: 'scored from quiz_responses by the quiz engine.'
    },
    {
      field: 'public.matching_suggestions',
      lineage: 'computed from matchable attributes, quiz results, and the friend graph.'
    },
    {
      field: 'public.module_moderator_notes',
      lineage: 'moderator notes from quiz answers.'
    },
    {
      field: 'public.freshness_prompts',
      lineage: 'prompts derived from profile facts.'
    },
    {
      field: 'public.user_identity.avatar_media_id',
      lineage: 'filtered copy of avatar_original_media_id when avatar_filter is set.'
    }
  ];

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const schema = {
    generated_from: 'infra/supabase/migrations',
    migration_order: files,
    duplicate_prefixes: Object.fromEntries(
      Object.entries(dupPrefixes).filter(([, list]) => list.length > 1)
    ),
    extensions,
    enums: [...enums.values()].sort((a, b) => a.name.localeCompare(b.name)),
    functions: [...functions.values()].sort((a, b) => a.name.localeCompare(b.name)),
    triggers,
    grants,
    tables: tableList,
    views: [],
    storage_buckets_in_sql: [],
    flags: {
      rls_disabled: rlsOff.map((t) => t.key),
      rls_enabled_without_policies: rlsOnNoPolicy.map((t) => t.key),
      permissive_using_true: permissive.map((p) => ({
        name: p.name,
        table: p.table_key,
        command: p.command,
        roles: p.roles,
        includes_anon: p.includes_anon,
        sql: p.sql
      })),
      security_definer_functions: [...functions.values()]
        .filter((f) => f.security_definer)
        .map((f) => f.name)
    },
    drift_vs_database_types: {
      tables_in_migrations_missing_from_database_types: missingFromTypes,
      tables_in_database_types_missing_from_migrations: extraInTypes,
      enums_in_migrations_missing_from_database_types: missingEnums
    },
    unparsed,
    dropped,
    seed_inserts: seeds
  };

  fs.writeFileSync(path.join(OUT_DIR, 'schema.json'), JSON.stringify(schema, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'catalog-seed.json'), JSON.stringify(catalog, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, 'api-surface.json'),
    JSON.stringify(
      {
        note: 'Nest uses SupabaseService.admin (service role) for .from() calls. Guards are JWT or admin, not RLS.',
        routes,
        from_calls: fromCalls,
        modules: Object.fromEntries(
          Object.entries(byModule).map(([mod, info]) => [
            mod,
            {
              tables: info.tables,
              rpcs: [...new Set(info.rpcs)],
              routes: (routesByFile[mod] || []).map((r) => ({
                method: r.method,
                path: r.path,
                guards: r.guards,
                file: r.file
              }))
            }
          ])
        ),
        mobile_direct: mobileDirect
      },
      null,
      2
    )
  );

  const lines = [];
  lines.push('# Generated table appendix');
  lines.push('');
  lines.push('Machine output of `scripts/data-inventory/generate.mjs`. Do not edit by hand.');
  lines.push('Regenerate after a migration. Quoted policy SQL is the parser flattening of the migration text.');
  lines.push('');
  for (const table of tableList) {
    lines.push(`## ${table.key}`);
    lines.push('');
    lines.push(`Created in \`${table.created_in}\`. RLS enabled: ${table.rls_enabled ? 'yes' : 'NO'}. Policies: ${table.policies.length}.`);
    lines.push('');
    lines.push('| Column | Type | Nullable | PK | References | On delete | Added in |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const col of table.columns) {
      const ref = col.references
        ? `${col.references.schema}.${col.references.table}(${col.references.column})`
        : '';
      lines.push(
        `| ${col.name} | ${col.type.replace(/\|/g, '\\|')} | ${col.nullable ? 'yes' : 'no'} | ${col.primary_key ? 'yes' : ''} | ${ref} | ${col.on_delete || ''} | ${col.added_in} |`
      );
    }
    lines.push('');
    if (table.indexes.length) {
      lines.push('Indexes:');
      for (const idx of table.indexes) {
        lines.push(
          `- \`${idx.name}\`${idx.unique ? ' unique' : ''} (${idx.columns})${idx.where ? ` where ${idx.where}` : ''} in \`${idx.defined_in}\``
        );
      }
      lines.push('');
    }
    if (table.policies.length === 0) {
      lines.push('Policies: none in migrations.');
      lines.push('');
    }
    for (const policy of table.policies) {
      lines.push(`Policy \`${policy.name}\` (${policy.command}, roles: ${policy.roles.join(', ') || 'not stated'}) in \`${policy.defined_in}\`:`);
      lines.push('');
      lines.push('```sql');
      lines.push(policy.sql);
      lines.push('```');
      lines.push('');
    }
  }
  lines.push('## Functions');
  lines.push('');
  for (const fn of [...functions.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(
      `- \`${fn.name}\` security_definer=${fn.security_definer} search_path=${fn.search_path || 'not set'} defined in \`${fn.defined_in}\``
    );
  }
  lines.push('');
  lines.push('## Triggers');
  lines.push('');
  for (const trg of triggers) {
    lines.push(
      `- \`${trg.name}\` ${trg.timing} ${trg.events} on ${trg.schema}.${trg.table} -> ${trg.function} (\`${trg.defined_in}\`)`
    );
  }
  lines.push('');
  lines.push('## Enums');
  lines.push('');
  for (const en of [...enums.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`- \`${en.name}\`: ${en.values.map((v) => `\`${v}\``).join(', ')}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'TABLES.md'), lines.join('\n'));

  const summary = {
    migrations: files.length,
    tables: tableList.length,
    columns: catalog.length,
    policies: policies.length,
    functions: functions.size,
    triggers: triggers.length,
    enums: enums.size,
    rls_disabled: rlsOff.map((t) => t.key),
    rls_enabled_without_policies: rlsOnNoPolicy.map((t) => t.key),
    permissive_count: permissive.length,
    permissive: permissive.map((p) => `${p.table_key}.${p.name} [${p.command}] anon=${p.includes_anon}`),
    security_definer: [...functions.values()].filter((f) => f.security_definer).map((f) => f.name),
    missing_from_types: missingFromTypes,
    extra_in_types: extraInTypes,
    missing_enums: missingEnums,
    unparsed_count: unparsed.length,
    unparsed: unparsed.slice(0, 40),
    routes: routes.length,
    routes_without_guards: routes.filter((r) => r.guards.length === 0).map((r) => `${r.method} ${r.path}`),
    mobile_direct: mobileDirect,
    duplicate_prefixes: schema.duplicate_prefixes,
    derived
  };
  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({
    tables: summary.tables,
    columns: summary.columns,
    policies: summary.policies,
    functions: summary.functions,
    rls_disabled: summary.rls_disabled,
    rls_no_policy: summary.rls_enabled_without_policies,
    permissive_count: summary.permissive_count,
    unparsed_count: summary.unparsed_count,
    missing_from_types: summary.missing_from_types,
    routes: summary.routes,
    routes_without_guards: summary.routes_without_guards
  }, null, 2));
}

main();
