import { useEffect, useState } from 'react';
import { checkNanoAvailability, type NanoAvailability } from './languageModel';

/** Asks Chrome once whether Gemini Nano can run here. 'checking' until it answers. */
export function useNanoAvailability(): 'checking' | NanoAvailability {
  const [state, setState] = useState<'checking' | NanoAvailability>('checking');

  useEffect(() => {
    let active = true;
    checkNanoAvailability().then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
