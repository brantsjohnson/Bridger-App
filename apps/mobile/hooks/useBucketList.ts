// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Bucket List tab. Loads items, adds new ones, and checks
// them off — demo or live, same calls.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { BucketItem } from '@bridger/shared';
import {
  addBucketItem,
  listBucket,
  toggleBucketItem,
  type AddBucketInput
} from '../data/profile';

export function useBucketList() {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listBucket());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onAdd = useCallback(async (input: AddBucketInput) => {
    await addBucketItem(input);
    setItems(await listBucket());
  }, []);

  const onToggle = useCallback(async (id: string) => {
    await toggleBucketItem(id);
    setItems(await listBucket());
  }, []);

  return { items, loading, refresh, onAdd, onToggle };
}
