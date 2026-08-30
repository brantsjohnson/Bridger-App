// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Connection Reveal. Loads who you just connected with
// for Screen 0, remembers the "how did you two meet?" answers, and AFTER
// commit loads what you share + friend-of-friend suggestions for Screens 1–3.
//
// Fires the connection_revealed product event — never with place text, note
// text, or names. Only bools and tier labels.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import { trackProduct, type MeetContext, type Tier } from '@bridger/shared';
import { getRevealBridges } from '../data/discover';
import {
  getRevealBase,
  getRevealOverlap,
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

  // THIS SECTION DOES: load identity only (no overlap — live would 403).
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getRevealBase(personId, viaFriendId);
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
   * Persist Screen 0, then load overlap + FoF bridges for the story screens.
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

    // THIS SECTION DOES: now that met_context exists, fetch what you share.
    try {
      const overlap = await getRevealOverlap(personId);
      setPayload((prev) => (prev ? { ...prev, ...overlap } : prev));
    } catch {
      // Thin overlap is fine — story still plays with empty others.
    }
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

  /**
   * Re-fetch FoF bridges after the viewer turns Discover matching on from
   * the Screen 3 nudge.
   */
  const reloadBridges = useCallback(async () => {
    try {
      const bridges = await getRevealBridges(personId);
      setPayload((prev) =>
        prev
          ? {
              ...prev,
              discoverable: bridges.discoverable,
              bridgeSuggestions: bridges.suggestions
            }
          : prev
      );
    } catch {
      // Keep whatever we already have.
    }
  }, [personId]);

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
    canContinue: context !== null,
    reloadBridges
  };
}
