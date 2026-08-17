"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  ArrowLeft, Settings as SettingsIcon, User, Shield, Bell, Volume2,
  Trash2, LogOut, ChevronRight, Check, Zap, Bot, RotateCcw, Play,
} from 'lucide-react';

import { useSettings } from '../lib/settings';
import { BOT_DIFFICULTIES, DIFFICULTY_ORDER } from '../lib/bot';
import { resetLocalProgress, getLocalProfile } from '../lib/gameStore';
import { resetAchievements, getUnlocked, ACHIEVEMENTS } from '../lib/achievements';
import sfx from '../lib/sfx';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { settings, updateSetting, updateNotification } = useSettings();

  const [savedFlash, setSavedFlash] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  /**
   * Settings persist the moment they change (the provider owns that), so this
   * button just confirms it rather than pretending to do the work.
   */
  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleResetProgress = () => {
    if (!confirm('Reset local progress? Your ELO, XP, wins, match history and achievements on this device will be cleared. This cannot be undone.')) return;
    resetLocalProgress();
    resetAchievements();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  };

  const localProfile = typeof window !== 'undefined' ? getLocalProfile() : null;
  const unlockedCount = typeof window !== 'undefined' ? Object.keys(getUnlocked()).length : 0;

  const Toggle = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0">
        <div className="text-white font-mono text-sm font-bold">{label}</div>
        {description && <div className="text-gray-500 text-xs font-mono mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => { onChange(!enabled); sfx.select(); }}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-700'}`}
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
      <div className="border-b border-gray-800 bg-black/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <motion.button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-800 rounded-lg shrink-0"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </motion.button>
            <span className="text-white text-xl font-bold font-mono flex items-center gap-2 truncate">
              <SettingsIcon className="w-6 h-6 text-gray-400 shrink-0" />
              SETTINGS
            </span>
          </div>

          <motion.button
            onClick={flashSaved}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all shrink-0 ${
              savedFlash ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            {savedFlash ? <><Check className="w-4 h-4" /> SAVED</> : 'AUTOSAVES'}
          </motion.button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <p className="text-gray-600 font-mono text-xs -mb-4">
          Changes apply immediately and are stored on this device.
        </p>

        {/* Account */}
        <Section title="Account" icon={User} delay={0}>
          {user ? (
            <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden shrink-0">
                {user.imageUrl && <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-mono font-bold truncate">
                  {user.fullName || user.username || 'Player'}
                </div>
                <div className="text-gray-500 text-xs font-mono truncate">
                  {user.emailAddresses?.[0]?.emailAddress}
                </div>
              </div>
              <button
                onClick={() => router.push('/profile')}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-mono flex items-center gap-1 shrink-0"
              >
                Edit <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-gray-500 font-mono text-sm">Playing as a guest — progress is saved on this device.</p>
          )}
        </Section>

        {/* Gameplay */}
        <Section title="Gameplay" icon={Zap} delay={0.05}>
          <div className="divide-y divide-gray-800">
            <div className="flex items-center justify-between py-3 gap-4">
              <div className="min-w-0">
                <div className="text-white font-mono text-sm font-bold">Sound Effects</div>
                <div className="text-gray-500 text-xs font-mono mt-0.5">Synthesised combat audio — no downloads</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => sfx.hit()}
                  disabled={!settings.soundEnabled}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300"
                  aria-label="Test sound"
                  title="Test sound"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { updateSetting('soundEnabled', !settings.soundEnabled); }}
                  role="switch"
                  aria-checked={settings.soundEnabled}
                  aria-label="Sound Effects"
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                    animate={{ left: settings.soundEnabled ? '26px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            <Toggle
              enabled={settings.animationsEnabled}
              onChange={(v) => updateSetting('animationsEnabled', v)}
              label="Animations"
              description="Turn off to reduce motion and save battery"
            />

            <div className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-white font-mono text-sm font-bold">Code Editor Font Size</div>
                  <div className="text-gray-500 text-xs font-mono mt-0.5">Applies to the combat editor</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => updateSetting('codeEditorFontSize', Math.max(10, settings.codeEditorFontSize - 1))}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold flex items-center justify-center"
                    aria-label="Decrease font size"
                  >−</button>
                  <span className="text-white font-mono font-bold w-8 text-center">{settings.codeEditorFontSize}</span>
                  <button
                    onClick={() => updateSetting('codeEditorFontSize', Math.min(24, settings.codeEditorFontSize + 1))}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold flex items-center justify-center"
                    aria-label="Increase font size"
                  >+</button>
                </div>
              </div>
              <div
                className="mt-3 bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-green-400 overflow-x-auto"
                style={{ fontSize: `${settings.codeEditorFontSize}px` }}
              >
                function sumArray(nums) &#123; … &#125;
              </div>
            </div>
          </div>
        </Section>

        {/* Opponent */}
        <Section title="Default Opponent" icon={Bot} delay={0.1}>
          <p className="text-gray-500 text-xs font-mono mb-4">
            Pre-selected when you open matchmaking.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTY_ORDER.map((id) => {
              const d = BOT_DIFFICULTIES[id];
              const active = settings.botDifficulty === id;
              return (
                <button
                  key={id}
                  onClick={() => { updateSetting('botDifficulty', id); sfx.select(); }}
                  aria-pressed={active}
                  className={`py-3 px-2 rounded-lg border-2 font-mono text-xs font-bold transition-all ${
                    active ? `${d.border} ${d.color} bg-white/[0.03]` : 'border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy" icon={Shield} delay={0.15}>
          <div className="divide-y divide-gray-800">
            <Toggle
              enabled={settings.showProfile}
              onChange={(v) => updateSetting('showProfile', v)}
              label="Public Profile"
              description="Show your profile on the leaderboard"
            />
            <Toggle
              enabled={settings.showMatchHistory}
              onChange={(v) => updateSetting('showMatchHistory', v)}
              label="Public Match History"
              description="Allow others to see your match results"
            />
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell} delay={0.2}>
          <div className="divide-y divide-gray-800">
            <Toggle
              enabled={settings.notifications.matchResults}
              onChange={(v) => updateNotification('matchResults', v)}
              label="Match Results"
              description="Alerts when matches end"
            />
            <Toggle
              enabled={settings.notifications.rankChanges}
              onChange={(v) => updateNotification('rankChanges', v)}
              label="Rank Changes"
              description="Alerts when your rank changes"
            />
            <Toggle
              enabled={settings.notifications.challenges}
              onChange={(v) => updateNotification('challenges', v)}
              label="Challenge Invites"
              description="Alerts when someone challenges you"
            />
          </div>
        </Section>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-gray-900/50 border border-red-500/30 rounded-xl p-6"
        >
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider font-mono mb-4">
            ⚠️ Danger Zone
          </h2>

          {localProfile && (
            <p className="text-gray-500 font-mono text-xs mb-4">
              Local record: {localProfile.wins}W / {localProfile.losses}L · {localProfile.elo_rating} ELO · {localProfile.xp} XP
              {' · '}{unlockedCount}/{ACHIEVEMENTS.length} achievements
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResetProgress}
              className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-gray-300 font-mono text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                {resetDone ? 'Progress cleared — reload to see it' : 'Reset Local Progress'}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            {user && (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-gray-300 font-mono text-sm flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            )}

            {/* Account deletion is handled by the identity provider — linking there
                is honest, unlike the old flow which only renamed the profile row. */}
            {user && (
              <a
                href="https://accounts.clerk.com/user"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
              >
                <span className="text-red-400 font-mono text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </span>
                <span className="text-red-400/60 font-mono text-xs">via account portal ↗</span>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, delay, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
    >
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {title}
      </h2>
      {children}
    </motion.section>
  );
}
