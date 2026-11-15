// Only the pieces we need: core + DES (lives in tripledes.js) + ECB; PKCS7 and UTF-8 are in core.
import CryptoJS from 'crypto-js/core';
import 'crypto-js/tripledes';
import 'crypto-js/mode-ecb';

/** Obfuscation key extracted from the public ChildFirst app (not a secret). */
export const DES_KEY = '1vCk0yW7';

/** DES/ECB/PKCS7 -> base64, matching the app's credential encoding. */
export function encCreds(s: string): string {
  const key = CryptoJS.enc.Utf8.parse(DES_KEY);
  return CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(s), key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}
