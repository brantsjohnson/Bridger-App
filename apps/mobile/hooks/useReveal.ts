// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Connection Reveal. Loads what you share with someone,
// remembers the "how did you two meet?" answers (including optional circle
// and optional note), and commits them when you leave Screen 0.
//
// Fires the connection_revealed product event — never with place text, note
// text, or names. Only bools and tier labels.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import { trackProduct, type MeetContext, type Tier } from '@bridger/shared';
import {
  getReveal,
  saveHowYouMet,
  type RevealPayload
} from '../data/reveal';

export function useReveal(personId: string, viaFriendId?: string) {
  const [payload, setPayload] = useState<RevealPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<MeetContext | null>(null);
  /**
   * Optional circle when they already know each other. Just-met always forces
   * acquaintance in saveHowYouMet, so this stays null for that path.
   */
  const [tier, setTier] = useState<Tier | null>(null);
  /**
   * PRIVACY: place defaults ON for in-person / QR. Discover (via a mutual)
   * defaults OFF — there usually is no place to record — and we offer a note
   * instead. Flipped once payload loads.
   */
  const [recordPlace, setRecordPlace] = useState(true);
  const [meetNote, setMeetNote] = useState('');
  const [committed, setCommitted] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getReveal(personId, viaFriendId);
      setPayload(next);
      // Discover path: don't push a place checkbox they can't use.
      setRecordPlace(!next.via);
    } finally {
      setLoading(false);
    }
  }, [personId, viaFriendId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Persist Screen 0 and fire the product outcome.
   * PRIVACY: analytics gets recorded_where / added_note (bools) and tier only —
   * never the place string, note text, or names.
   */
  const commit = useCallback(async () => {
    if (!context || committed) return null;
    const viaName = payload?.via?.name.split(' ')[0];
    const result = await saveHowYouMet(personId, {
      context,
      recordPlace: payload?.via ? false : recordPlace,
      meetNote: payload?.via ? meetNote : undefined,
      tier: context === 'already-know' ? tier : null,
      viaName
    });
    trackProduct('connection_revealed', {
      recorded_where: result.recordedWhere,
      added_note: result.addedNote,
      meet_context: context,
      to_tier: result.tier
    });
    setCommitted(true);
    return result;
  }, [
    context,
    committed,
    personId,
    recordPlace,
    meetNote,
    tier,
    payload?.via
  ]);

  return {
    payload,
    loading,
    refresh,
    context,
    setContext,
    tier,
    setTier,
    recordPlace,
    setRecordPlace,
    meetNote,
    setMeetNote,
    commit,
    committed,
    canContinue: context !== null
  };
}
