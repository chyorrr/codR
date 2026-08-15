'use client';

/**
 * Settings that actually do something.
 *
 * The old settings page wrote to localStorage and nothing read it back. This
 * provider is the single source of truth: it hydrates from storage, mirrors the
 * values onto <html> (so CSS can react) and drives the sound engine.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setSoundEnabled } from './sfx';

const STORAGE_KEY = 'codR_settings';

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  animationsEnabled: true,
  showProfile: true,
  showMatchHistory: true,
  codeEditorFontSize: 14,
  botDifficulty: 'veteran',
  notifications: {
    matchResults: true,
    rankChanges: true,
    challenges: true,
  },
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  updateNotification: () => {},
  hydrated: false,
});

function merge(stored) {
  if (!stored || typeof stored !== 'object') return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(stored.notifications || {}) },
  };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate after mount so server and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings(merge(JSON.parse(raw)));
    } catch {
      /* fall back to defaults */
    }
    setHydrated(true);
  }, []);

  // Persist + apply every change.
  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota errors */
    }

    setSoundEnabled(settings.soundEnabled);

    const root = document.documentElement;
    root.dataset.animations = settings.animationsEnabled ? 'on' : 'off';
    root.style.setProperty('--code-font-size', `${settings.codeEditorFontSize}px`);
  }, [settings, hydrated]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateNotification = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  }, []);

  const value = useMemo(
    () => ({ settings, updateSetting, updateNotification, hydrated }),
    [settings, updateSetting, updateNotification, hydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
