import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useNanoAvailability } from './useNanoAvailability';
import { installFakeLanguageModel, uninstallFakeLanguageModel } from '../../test/fakeLanguageModel';

describe('useNanoAvailability', () => {
  afterEach(uninstallFakeLanguageModel);

  it("starts as 'checking' then reports Chrome's answer", async () => {
    installFakeLanguageModel({ availability: 'downloadable' });
    const { result } = renderHook(() => useNanoAvailability());
    expect(result.current).toBe('checking');
    await waitFor(() => expect(result.current).toBe('downloadable'));
  });

  it("reports 'unavailable' without the API", async () => {
    const { result } = renderHook(() => useNanoAvailability());
    await waitFor(() => expect(result.current).toBe('unavailable'));
  });
});
