'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '../../utils/supabase/client';

export default function AuthDebugger() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const fetchProfile = async () => {
        setLoading(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          setProfileError(error.message);
          setProfile(null);
        } else {
          setProfile(data);
          setProfileError(null);
        }
        setLoading(false);
      };

      fetchProfile();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [user, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 font-mono text-sm">
        <div className="text-yellow-400 animate-pulse">⏳ Loading Clerk...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="bg-gray-900 border border-red-500/50 rounded-xl p-6 font-mono text-sm">
        <div className="text-red-400">❌ NOT SIGNED IN - Please authenticate via Clerk</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-green-500/50 rounded-xl p-6 font-mono text-sm space-y-4">
      <h2 className="text-green-400 text-lg font-bold border-b border-green-500/30 pb-2">
        🔍 PHASE 1 AUTH DEBUGGER
      </h2>

      {/* Clerk Identity Section */}
      <div className="space-y-2">
        <h3 className="text-cyan-400 font-semibold">CLERK IDENTITY:</h3>
        <div className="pl-4 space-y-1">
          <div className="text-gray-300">
            <span className="text-gray-500">clerk_id:</span> {user.id}
          </div>
          <div className="text-gray-300">
            <span className="text-gray-500">email:</span> {user.emailAddresses?.[0]?.emailAddress || 'N/A'}
          </div>
          <div className="text-gray-300">
            <span className="text-gray-500">username:</span> {user.username || 'N/A'}
          </div>
          <div className="text-gray-300">
            <span className="text-gray-500">first_name:</span> {user.firstName || 'N/A'}
          </div>
        </div>
      </div>

      {/* Supabase Profile Section */}
      <div className="space-y-2">
        <h3 className="text-cyan-400 font-semibold">SUPABASE PROFILE:</h3>
        {loading ? (
          <div className="pl-4 text-yellow-400 animate-pulse">⏳ Fetching profile...</div>
        ) : profileError ? (
          <div className="pl-4 space-y-2">
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500 text-red-400 px-3 py-1 rounded">
              ❌ PROFILE MISSING
            </div>
            <div className="text-red-400 text-xs">Error: {profileError}</div>
          </div>
        ) : profile ? (
          <div className="pl-4 space-y-2">
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500 text-green-400 px-3 py-1 rounded">
              ✅ DATABASE SYNCED
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">profile_id:</span> {profile.id}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">username:</span> {profile.username || 'Not set'}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">elo_rating:</span> {profile.elo_rating}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">xp:</span> {profile.xp}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">created_at:</span> {new Date(profile.createdAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="pl-4 text-yellow-400">⚠️ No profile data returned</div>
        )}
      </div>

      {/* Sync Status */}
      <div className="border-t border-gray-700 pt-4">
        <div className={`text-center py-2 rounded ${
          profile && !profileError 
            ? 'bg-green-500/20 text-green-400 border border-green-500' 
            : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}>
          {profile && !profileError 
            ? '🎯 CLERK ↔ SUPABASE SYNC: VERIFIED' 
            : '⚠️ CLERK ↔ SUPABASE SYNC: FAILED'}
        </div>
      </div>
    </div>
  );
}
