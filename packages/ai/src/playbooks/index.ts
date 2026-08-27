// ============================================
// WHAT THIS FILE DOES (plain English):
// Public door into Bridge playbook loading for Nest (not for clients).
// ============================================

export type { PlaybookId, PlaybookDocument } from './types';
export {
  ALL_PLAYBOOK_IDS,
  INTENT_TO_PLAYBOOK
} from './types';
export {
  loadPlaybook,
  playbookForIntent,
  listPlaybookIds,
  parsePlaybookVersion,
  clearPlaybookCache
} from './loader';
