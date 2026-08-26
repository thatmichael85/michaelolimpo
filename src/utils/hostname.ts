/**
 * Resolves the display domain string for the footer.
 * Falls back to 'mikeosoft.ai' for local development or empty hostnames.
 */
export function getDisplayHostname(hostname?: string, year?: number): string {
  const currentHost = hostname !== undefined ? hostname : (typeof window !== 'undefined' ? window.location.hostname : '');
  const currentYear = year !== undefined ? year : new Date().getFullYear();

  const isLocalOrEmpty =
    !currentHost ||
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    currentHost === '';

  const displayHost = isLocalOrEmpty ? 'mikeosoft.ai' : currentHost;
  return `${displayHost} · ${currentYear}`;
}
