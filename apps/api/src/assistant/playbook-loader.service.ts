// ============================================
// WHAT THIS FILE DOES (plain English):
// Nest wrapper that loads Bridge playbooks (markdown manuals) and hands the
// matching version to personal_agent prompts. Humans write playbooks; this
// only reads them.
// ============================================
import { Injectable } from '@nestjs/common';
import {
  loadPlaybook,
  playbookForIntent,
  listPlaybookIds,
  type PlaybookDocument,
  type PlaybookId
} from '@bridger/ai';

@Injectable()
export class PlaybookLoaderService {
  /** Load by stable id (e.g. event-creation). */
  get(id: PlaybookId): PlaybookDocument {
    return loadPlaybook(id);
  }

  /** Map an agent_query intent to the right playbook. */
  forIntent(intent: string | null | undefined): PlaybookDocument {
    return playbookForIntent(intent);
  }

  listIds(): PlaybookId[] {
    return listPlaybookIds();
  }
}
