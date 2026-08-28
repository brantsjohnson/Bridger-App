// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for your contact card — the once-set card that Share contact
// sends into a thread. Loads fields, toggles which ones are on, and saves.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { ContactCard, ContactField } from '@bridger/shared';
import { getContactCard, setContactCard } from '../data/messages';

export function useContactCard() {
  const [card, setCard] = useState<ContactCard | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCard(await getContactCard());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onToggleField = useCallback(
    async (fieldId: string, enabled: boolean) => {
      if (!card) return;
      const next: ContactCard = {
        ...card,
        fields: card.fields.map((f) =>
          f.id === fieldId ? { ...f, enabled } : f
        )
      };
      setCard(next);
      await setContactCard(next);
    },
    [card]
  );

  /** Edit a field's value (never log the text — PRIVACY). */
  const onUpdateFieldValue = useCallback(
    async (fieldId: string, value: string) => {
      if (!card) return;
      const next: ContactCard = {
        ...card,
        fields: card.fields.map((f) =>
          f.id === fieldId ? { ...f, value } : f
        )
      };
      setCard(next);
      await setContactCard(next);
    },
    [card]
  );

  const onSave = useCallback(
    async (fields: ContactField[]) => {
      if (!card) return;
      const next = { ...card, fields };
      setCard(await setContactCard(next));
    },
    [card]
  );

  return {
    card,
    loading,
    refresh,
    onToggleField,
    onUpdateFieldValue,
    onSave
  };
}
