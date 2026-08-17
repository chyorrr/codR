'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Ensures the signed-in Clerk user has a matching profile row.
 *
 * This used to write to Supabase straight from the browser with the anon key,
 * which meant the database had to accept client writes — and anything that
 * accepts a client write accepts a forged one. Now it just pings the server
 * route, which creates the profile with the service role key if it is missing.
 */
export function useSyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setSyncStatus('idle');
      return;
    }

    let cancelled = false;

    const sync = async () => {
      setSyncStatus('syncing');
      try {
        const res = await fetch('/api/profile');
        if (cancelled) return;

        if (!res.ok) {
          setSyncStatus(res.status === 401 ? 'idle' : 'error');
          setError(`Profile sync returned ${res.status}`);
          return;
        }

        const data = await res.json();
        // `persisted: false` means the row could not be stored — the arena keeps
        // running on local progress, so this is a soft state, not a failure.
        setSyncStatus(data.persisted === false ? 'offline' : 'synced');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setSyncStatus('offline');
        setError(err?.message || 'Profile service unreachable');
      }
    };

    sync();
    return () => { cancelled = true; };
  }, [user, isLoaded, isSignedIn]);

  return { syncStatus, error, isLoaded, isSignedIn, user };
}
