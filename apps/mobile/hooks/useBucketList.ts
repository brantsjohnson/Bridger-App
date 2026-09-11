// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the Bucket List tab. Loads items, adds new ones, checks
// them off, edits them, and deletes them — demo or live, same calls.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { BucketItem } from '@bridger/shared';
import {
  addBucketItem,
  deleteBucketItem,
  listBucket,
  toggleBucketItem,
  updateBucketItem,
  type AddBucketInput
} from '../data/profile';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

const SNAP_KEY = 'bucket';

export function useBucketList() {
  const cached = getTabSnapshot<BucketItem[]>(SNAP_KEY);
  const [items, setItems] = useState<BucketItem[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    const hadCache = Boolean(getTabSnapshot<BucketItem[]>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const next = await listBucket();
      setItems(next);
      setTabSnapshot(SNAP_KEY, next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const replace = useCallback(async () => {
    const next = await listBucket();
    setItems(next);
    setTabSnapshot(SNAP_KEY, next);
  }, []);

  const onAdd = useCallback(async (input: AddBucketInput) => {
    await addBucketItem(input);
    await replace();
  }, [replace]);

  const onToggle = useCallback(async (id: string) => {
    await toggleBucketItem(id);
    await replace();
  }, [replace]);

  const onUpdate = useCallback(async (id: string, input: AddBucketInput) => {
    await updateBucketItem(id, input);
    await replace();
  }, [replace]);

  const onDelete = useCallback(async (id: string) => {
    await deleteBucketItem(id);
    await replace();
  }, [replace]);

  return { items, loading, refresh, onAdd, onToggle, onUpdate, onDelete };
}
