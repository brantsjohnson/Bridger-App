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
  type RecapSummary,
  type SubmittedQuestion
} from '../data/pod';

export function useFriendPod() {
  const [recap, setRecap] = useState<RecapSummary | null>(null);
  const [questions, setQuestions] = useState<SubmittedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [week, qs] = await Promise.all([getRecapWeek(), listSubmittedQuestions()]);
      setRecap(week);
      setQuestions(qs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSubmitQuestion = useCallback(async (text: string) => {
    await submitQuestion({ text });
    setQuestions(await listSubmittedQuestions());
  }, []);

  return { recap, questions, loading, refresh, onSubmitQuestion };
}
