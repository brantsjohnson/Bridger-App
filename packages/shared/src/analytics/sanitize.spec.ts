// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that the analytics sanitizer keeps taxonomy fields and drops
// anything that looks like a name, email, or message.
// ============================================
import { sanitizeAnalyticsProps } from './sanitize';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const cleaned = sanitizeAnalyticsProps({
  id: 'profile.settings.analytics_toggle',
  screen: 'profile',
  method: 'settings',
  count: 1,
  first_interaction: true,
  email: 'ada@example.com',
  name: 'Ada',
  message: 'hello friend',
  user_email: 'ada@example.com',
  note: 'secret thought',
  caption: 'a caption',
  bio: 'not blocked by key name but check value',
  leak: 'ada@example.com'
});

assert(cleaned.id === 'profile.settings.analytics_toggle', 'kept id');
assert(cleaned.screen === 'profile', 'kept screen');
assert(cleaned.method === 'settings', 'kept method');
assert(cleaned.count === 1, 'kept count');
assert(cleaned.first_interaction === true, 'kept bool');
assert(cleaned.email === undefined, 'dropped email');
assert(cleaned.name === undefined, 'dropped name');
assert(cleaned.message === undefined, 'dropped message');
assert(cleaned.user_email === undefined, 'dropped user_email');
assert(cleaned.note === undefined, 'dropped note');
assert(cleaned.caption === undefined, 'dropped caption');
assert(cleaned.leak === undefined, 'dropped email-like value');
assert(cleaned.bio === 'not blocked by key name but check value', 'kept bio key without blocked substring');

console.log('sanitize.spec.ts: ok');
