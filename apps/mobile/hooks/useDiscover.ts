// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Discover tab. Loads opt-in settings, suggestions,
// requests, and match-module progress. Mutations refresh local state so the
// screen does not care whether data is demo or live.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { ApprovalRequest, DiscoverSettings, Suggestion } from '@bridger/shared';
import {
  acceptRequest,
  addSuggestion,
  completeMatchModule,
  declineRequest,
  dontSuggestAgain,
  getCommonalities,
  getDiscoverSettings,
  listCompletedModules,
  listMatchModules,
  listRequests,
  listSuggestions,
  setDiscoverable,
  setSources,
  type Commonality,
  type MatchModule
} from '../data/discover';

export function useDiscover() {
  const [settings, setSettings] = useState<DiscoverSettings | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [modules, setModules] = useState<MatchModule[]>([]);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sug, req, mods, done] = await Promise.all([
        getDiscoverSettings(),
        listSuggestions(),
        listRequests(),
        listMatchModules(),
        listCompletedModules()
      ]);
      setSettings(s);
      setSuggestions(sug);
      setRequests(req);
      setModules(mods);
      setCompletedModuleIds(done);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSetDiscoverable = useCallback(async (on: boolean) => {
    setSettings(await setDiscoverable(on));
    setSuggestions(await listSuggestions());
  }, []);

  const onSetSources = useCallback(async (patch: Partial<DiscoverSettings['sources']>) => {
    setSettings(await setSources(patch));
    setSuggestions(await listSuggestions());
  }, []);

  const onAcceptRequest = useCallback(async (id: string) => {
    await acceptRequest(id);
    setRequests(await listRequests());
  }, []);

  const onDeclineRequest = useCallback(async (id: string) => {
    await declineRequest(id);
    setRequests(await listRequests());
  }, []);

  const onAddSuggestion = useCallback(async (id: string) => {
    await addSuggestion(id);
    setSuggestions(await listSuggestions());
  }, []);

  const onDontSuggest = useCallback(async (id: string) => {
    await dontSuggestAgain(id);
    setSuggestions(await listSuggestions());
  }, []);

  const onCompleteModule = useCallback(async (moduleId: string) => {
    await completeMatchModule(moduleId);
    setCompletedModuleIds(await listCompletedModules());
  }, []);

  const loadCommonalities = useCallback(async (personId: string): Promise<Commonality[]> => {
    return getCommonalities(personId);
  }, []);

  return {
    settings,
    suggestions,
    requests,
    modules,
    completedModuleIds,
    loading,
    refresh,
    onSetDiscoverable,
    onSetSources,
    onAcceptRequest,
    onDeclineRequest,
    onAddSuggestion,
    onDontSuggest,
    onCompleteModule,
    loadCommonalities
  };
}
