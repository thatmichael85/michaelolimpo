import { afterEach, describe, expect, it } from 'vitest';
import { checkNanoAvailability, NANO_OPTIONS, type NanoAvailability } from './languageModel';
import { installFakeLanguageModel, uninstallFakeLanguageModel } from '../../test/fakeLanguageModel';

describe('checkNanoAvailability', () => {
  afterEach(uninstallFakeLanguageModel);

  it("returns 'unavailable' when the Prompt API is missing", async () => {
    expect(await checkNanoAvailability()).toBe('unavailable');
  });

  it('returns what Chrome reports', async () => {
    const states: NanoAvailability[] = ['available', 'downloadable', 'downloading', 'unavailable'];
    for (const state of states) {
      installFakeLanguageModel({ availability: state });
      expect(await checkNanoAvailability()).toBe(state);
    }
  });

  it('asks for English text in and out', async () => {
    const fake = installFakeLanguageModel();
    await checkNanoAvailability();
    expect(fake.availability).toHaveBeenCalledWith(NANO_OPTIONS);
    expect(NANO_OPTIONS.expectedInputs[0].languages).toEqual(['en']);
    expect(NANO_OPTIONS.expectedOutputs[0].languages).toEqual(['en']);
  });

  it('treats a throwing availability() as unavailable', async () => {
    installFakeLanguageModel({ availability: new Error('boom') });
    expect(await checkNanoAvailability()).toBe('unavailable');
  });
});
