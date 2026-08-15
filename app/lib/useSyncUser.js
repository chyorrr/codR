'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '../../utils/supabase/client';

export function useSyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setSyncStatus('idle');
      return;
    }

    const syncUserToSupabase = async () => {
      setSyncStatus('syncing');
      const supabase = createClient();

      try {
        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!existingProfile) {
          // Create new profile
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: user.username || user.firstName || null,
              avatar_url: user.imageUrl || null,
              elo_rating: 1200,
              xp: 0,
              wins: 0,
              losses: 0,
              total_matches: 0,
              kill_streak: 0,
              best_streak: 0,
              rank_title: 'Recruit',
            }, {
              onConflict: 'id'
            });

          if (upsertError) throw upsertError;

          console.log('[useSyncUser] Profile created for:', user.id);

          // Grant starter weapons to new users
          try {
            const { data: starterWeapons } = await supabase
              .from('weapons')
              .select('id')
              .eq('unlock_level', 0)
              .limit(3);

            if (starterWeapons && starterWeapons.length > 0) {
              const weaponInserts = starterWeapons.map((w, idx) => ({
                profile_id: user.id,
                weapon_id: w.id,
                is_equipped: idx === 0, // Equip the first one
              }));

              await supabase
                .from('user_weapons')
                .upsert(weaponInserts, { onConflict: 'profile_id,weapon_id' });

              console.log('[useSyncUser] Granted', starterWeapons.length, 'starter weapons');
            }
          } catch (weaponErr) {
            console.warn('[useSyncUser] Starter weapon grant failed (non-critical):', weaponErr.message);
          }
        } else {
          // Update avatar if changed
          await supabase
            .from('profiles')
            .update({ avatar_url: user.imageUrl || null })
            .eq('id', user.id);

          console.log('[useSyncUser] Profile already exists for:', user.id);
        }

        setSyncStatus('synced');
        setError(null);
      } catch (err) {
        // The database is optional — gameplay and local progress continue
        // regardless, so an unreachable host is a warning, not an error.
        const message = err?.message || 'Unknown error during sync';
        const offline = /fetch|network|ENOTFOUND|Failed to fetch/i.test(message);
        if (offline) {
          console.warn('[useSyncUser] Supabase unreachable — running on local progress only');
          setSyncStatus('offline');
        } else {
          console.error('[useSyncUser] Sync failed:', err);
          setSyncStatus('error');
        }
        setError(message);
      }
    };

    syncUserToSupabase();
  }, [user, isLoaded, isSignedIn]);

  return { syncStatus, error, isLoaded, isSignedIn, user };
}
