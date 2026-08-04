// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Connection Reveal. Loads what you share with someone,
// remembers the "how did you two meet?" answers, and commits them when you
// leave Screen 0 (fires the connection_revealed product event — never with
// place text or names).
// ============================================
import { useCallback, useEffect, useState } from 'react';
import { trackProduct, type MeetContext } from '@bridger/shared';
import {
  getReveal,
  saveHowYouMet,
  type RevealPayload
} from '../data/reveal';

export function useReveal(personId: string, viaFriendId?: string) {
  const [payload, setPayload] = useState<RevealPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<MeetContext | null>(null);
  /** PRIVACY: default ON — coarse place only; user can uncheck */
  const [recordPlace, setRecordPlace] = useState(true);
  const [committed, setCommitted] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPayload(await getReveal(personId, viaFriendId));
    } finally {
      setLoading(false);
    }
  }, [personId, viaFriendId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Persist Screen 0 and fire the product outcome.
   * PRIVACY: analytics gets recorded_where (bool) only — never the place string.
   */
  const commit = useCallback(async () => {
    if (!context || committed) return null;
    const viaName = payload?.via?.name.split(' ')[0];
    const result = await saveHowYouMet(personId, {
      context,
      recordPlace,
      viaName
    });
    trackProduct('connection_revealed', {
      recorded_where: result.recordedWhere
    });
    setCommitted(true);
    return result;
  }, [context, committed, personId, recordPlace, payload?.via?.name]);

  return {
    payload,
    loading,
    refresh,
    context,
    setContext,
    recordPlace,
    setRecordPlace,
    commit,
    committed,
    canContinue: context !== null
  };
}
