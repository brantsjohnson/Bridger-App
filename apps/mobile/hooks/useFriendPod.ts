// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Friend Pod entry on Friends. Loads this week's recap
// summary (voices + minutes) for the widget. The full player ships later.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import {
  getRecapWeek,
  listSubmittedQuestions,
  submitQuestion,
  voteQuestion,
  type RecapSummary,
  type SubmittedQuestion
} from '../data/pod';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

type PodSnap = {
  recap: RecapSummary | null;
  questions: SubmittedQuestion[];
};

const SNAP_KEY = 'pod';

export function useFriendPod() {
  const cached = getTabSnapshot<PodSnap>(SNAP_KEY);
  const [recap, setRecap] = useState<RecapSummary | null>(cached?.recap ?? null);
  const [questions, setQuestions] = useState<SubmittedQuestion[]>(
    cached?.questions ?? []
  );
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    const hadCache = Boolean(getTabSnapshot<PodSnap>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const [week, qs] = await Promise.all([getRecapWeek(), listSubmittedQuestions()]);
      setRecap(week);
      setQuestions(qs);
      setTabSnapshot<PodSnap>(SNAP_KEY, { recap: week, questions: qs });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSubmitQuestion = useCallback(async (text: string) => {
    await submitQuestion({ text });
    const qs = await listSubmittedQuestions();
    setQuestions(qs);
    const prev = getTabSnapshot<PodSnap>(SNAP_KEY);
    setTabSnapshot<PodSnap>(SNAP_KEY, { recap: prev?.recap ?? recap, questions: qs });
  }, [recap]);

  const onVoteQuestion = useCallback(async (id: string) => {
    await voteQuestion(id);
    const qs = await listSubmittedQuestions();
    setQuestions(qs);
    const prev = getTabSnapshot<PodSnap>(SNAP_KEY);
    setTabSnapshot<PodSnap>(SNAP_KEY, { recap: prev?.recap ?? recap, questions: qs });
  }, [recap]);

  return { recap, questions, loading, refresh, onSubmitQuestion, onVoteQuestion };
}
