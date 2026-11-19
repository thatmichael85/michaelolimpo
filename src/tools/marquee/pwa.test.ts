import { describe, expect, it, vi } from 'vitest';
import { reloadOnUpdate } from './pwa';

describe('reloadOnUpdate', () => {
  it('reloads once when a new version takes over on the setup screen', () => {
    const reload = vi.fn();
    const handler = reloadOnUpdate({ hadController: true, isPlaying: () => false, reload });
    handler();
    handler();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('never reloads in the middle of showing the sign', () => {
    const reload = vi.fn();
    reloadOnUpdate({ hadController: true, isPlaying: () => true, reload })();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload on the very first install', () => {
    const reload = vi.fn();
    reloadOnUpdate({ hadController: false, isPlaying: () => false, reload })();
    expect(reload).not.toHaveBeenCalled();
  });
});
