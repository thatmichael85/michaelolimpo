import { useCallback, useEffect, useState } from 'react';
import { applyPreset, randomStyle, resetStyle, type PresetId } from './presets';
import { sanitize, type Settings } from './settings';
import { loadSettings, saveSettings } from './storage';

/** localStorage can throw on access (blocked storage); fall back to a no-op store. */
function storage(): Pick<Storage, 'getItem' | 'setItem'> {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

export interface SettingsApi {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  preset: (id: PresetId) => void;
  reset: () => void;
  randomize: () => void;
}

/** The one sign, loaded from and auto-saved to this device. */
export function useSettings(): SettingsApi {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(storage()));
  useEffect(() => saveSettings(storage(), settings), [settings]);
  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => sanitize({ ...s, ...patch })), []);
  const preset = useCallback((id: PresetId) => setSettings((s) => applyPreset(s, id)), []);
  const reset = useCallback(() => setSettings(resetStyle), []);
  const randomize = useCallback(() => setSettings((s) => randomStyle(s)), []);
  return { settings, update, preset, reset, randomize };
}
