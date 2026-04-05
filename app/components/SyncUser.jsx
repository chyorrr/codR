'use client';

import { useSyncUser } from '../lib/useSyncUser';

export default function SyncUser() {
  // The hook handles all sync logic
  const { syncStatus, error } = useSyncUser();

  // Optional: Log sync status for debugging
  if (process.env.NODE_ENV === 'development') {
    if (syncStatus === 'error') {
      console.error('[SyncUser] Sync error:', error);
    }
  }

  return null;
}
