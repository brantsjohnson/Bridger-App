// ============================================
// WHAT THIS FILE DOES (plain English):
// Quick checks that the J-name friend compatibility math stays fun and stable.
// Same inputs always give the same %. No AI.
// Run with: npx tsx packages/shared/src/model/jname.compat.spec.ts
// ============================================
import { jnameCompatibilityPercent } from './jname';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const same = jnameCompatibilityPercent(
  { jName: 'Jake', percent: 80, topNames: ['Jake', 'Josh', 'Joey'] },
  { jName: 'Jake', percent: 78 }
);
assert(same >= 82 && same <= 100, `same persona should score high, got ${same}`);

const topHit = jnameCompatibilityPercent(
  { jName: 'Jake', percent: 80, topNames: ['Josh', 'Joey', 'James'] },
  { jName: 'Josh', percent: 70 }
);
assert(topHit >= 68 && topHit < same, `top-pick hit should be medium-high, got ${topHit}`);

const far = jnameCompatibilityPercent(
  { jName: 'Jake', percent: 90, topNames: ['Jake'] },
  { jName: 'John', percent: 20 }
);
assert(far >= 22 && far < topHit, `different personas should score lower, got ${far}`);

const a = jnameCompatibilityPercent(
  { jName: 'Joey', percent: 55, topNames: [] },
  { jName: 'James', percent: 55 }
);
const b = jnameCompatibilityPercent(
  { jName: 'Joey', percent: 55, topNames: [] },
  { jName: 'James', percent: 55 }
);
assert(a === b, 'compatibility must be deterministic');

console.log('jname.compat.spec.ts ok');
