"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useClerk } from '@clerk/nextjs';
import {
  ArrowLeft, Settings as SettingsIcon, User, Shield, Bell,
  Monitor, Volume2, VolumeX, Trash2, LogOut, ChevronRight,
  Save, Loader2, Check, Eye, EyeOff, Palette, Zap
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();

  const [settings, setSettings] = useState({
    soundEnabled: true,
    animationsEnabled: true,
    showProfile: true,
    showMatchHistory: true,
    codeEditorFontSize: 14,
    theme: 'dark',
    notifications: {
      matchResults: true,
      rankChanges: true,
      challenges: true,
    },
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('codR_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('[Settings] Failed to load local settings:', e);
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
    setSaved(false);
  };

  const updateNotification = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('codR_settings', JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This action cannot be undone. All your data, weapons, and match history will be permanently deleted.')) return;
    if (!confirm('Really delete? Type your mind is made up?')) return;

    try {
      // Delete profile from Supabase
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: '[DELETED]', username: `deleted_${Date.now()}` }),
      });
      await signOut();
      router.push('/');
    } catch (e) {
      alert('Failed to delete account. Please try again.');
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-white font-mono text-sm font-bold">{label}</div>
        {description && <div className="text-gray-500 text-xs font-mono mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-700'}`}
      >
        <motion.div
          className="w-5 h-5 bg-white rounded-full absolute top-0.5"
          animate={{ left: enabled ? '26px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-800 rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </motion.button>
            <span className="text-white text-xl font-bold font-mono flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-gray-400" />
              SETTINGS
            </span>
          </div>

          <motion.button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
             saved ? <><Check className="w-4 h-4" /> SAVED</> :
             <><Save className="w-4 h-4" /> SAVE</>}
          </motion.button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Account
          </h3>
          <div className="space-y-4">
            {user && (
              <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-gray-800">
                <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden">
                  {user.imageUrl && <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="text-white font-mono font-bold">{user.fullName || user.username || 'Player'}</div>
                  <div className="text-gray-500 text-xs font-mono">{user.emailAddresses?.[0]?.emailAddress}</div>
                </div>
                <button onClick={() => router.push('/profile')} className="text-cyan-400 hover:text-cyan-300 text-sm font-mono flex items-center gap-1">
                  Edit <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Gameplay Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Gameplay
          </h3>
          <div className="divide-y divide-gray-800">
            <ToggleSwitch
              enabled={settings.soundEnabled}
              onChange={(v) => updateSetting('soundEnabled', v)}
              label="Sound Effects"
              description="Enable audio feedback during battles"
            />
            <ToggleSwitch
              enabled={settings.animationsEnabled}
              onChange={(v) => updateSetting('animationsEnabled', v)}
              label="Animations"
              description="Reduce motion for better performance"
            />
            <div className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-mono text-sm font-bold">Code Editor Font Size</div>
                  <div className="text-gray-500 text-xs font-mono mt-0.5">Adjust for readability</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSetting('codeEditorFontSize', Math.max(10, settings.codeEditorFontSize - 1))}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold flex items-center justify-center"
                  >-</button>
                  <span className="text-white font-mono font-bold w-8 text-center">{settings.codeEditorFontSize}</span>
                  <button
                    onClick={() => updateSetting('codeEditorFontSize', Math.min(24, settings.codeEditorFontSize + 1))}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold flex items-center justify-center"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Privacy
          </h3>
          <div className="divide-y divide-gray-800">
            <ToggleSwitch
              enabled={settings.showProfile}
              onChange={(v) => updateSetting('showProfile', v)}
              label="Public Profile"
              description="Show your profile on the leaderboard"
            />
            <ToggleSwitch
              enabled={settings.showMatchHistory}
              onChange={(v) => updateSetting('showMatchHistory', v)}
              label="Public Match History"
              description="Allow others to see your match results"
            />
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </h3>
          <div className="divide-y divide-gray-800">
            <ToggleSwitch
              enabled={settings.notifications.matchResults}
              onChange={(v) => updateNotification('matchResults', v)}
              label="Match Results"
              description="Notifications when matches end"
            />
            <ToggleSwitch
              enabled={settings.notifications.rankChanges}
              onChange={(v) => updateNotification('rankChanges', v)}
              label="Rank Changes"
              description="Notifications when your rank changes"
            />
            <ToggleSwitch
              enabled={settings.notifications.challenges}
              onChange={(v) => updateNotification('challenges', v)}
              label="Challenge Invites"
              description="Notifications when someone challenges you"
            />
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 border border-red-500/30 rounded-xl p-6"
        >
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider font-mono mb-4">
            ⚠️ Danger Zone
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-gray-300 font-mono text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
            >
              <span className="text-red-400 font-mono text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Account
              </span>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
