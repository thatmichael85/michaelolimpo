import { Text } from '../../../design-system/primitives/Text';

export const REPO_URL = 'https://github.com/thatmichael85/michaelolimpo';
export const SOURCE_URL = `${REPO_URL}/tree/main/src/tools/downloadphotos`;

/** Top-of-page notice, shown on every screen. Mirrors the static page's wording. */
export function PrivacyNotice() {
  return (
    <aside className="cf-notice" aria-label="About this tool">
      <Text className="cf-notice-why">
        <strong>Why this exists:</strong> I'm a parent who just wanted my kid's photos. The ChildFirst app has no way
        to download them in bulk, and ain't nobody got time to tap every photo one by one to save it to their phone.
        So I built this for myself and shared it in case it helps other parents.
      </Text>
      <ul className="cf-checklist">
        <li>No analytics, cookies or tracking</li>
        <li>
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Open source</a>
        </li>
        <li>Runs entirely in your browser, talking directly to ChildFirst</li>
        <li>Nothing saved — no server; logins and photos never touch mikeosoft.ai</li>
        <li>You only see your own child's photos (scoped to your login)</li>
      </ul>
      <Text variant="secondary" className="cf-fineprint">
        Personal, non-commercial project — not affiliated with or endorsed by ChildFirst or Taidii; their names
        belong to their owners. Provided as-is, with no warranty; use at your own risk. Only sign in with your own
        account, and you're responsible for following ChildFirst's terms. Photos may show other children — please
        keep them private and don't post them publicly. If you represent ChildFirst/Taidii and have concerns,{' '}
        <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">open an issue</a> and I'll respond
        promptly, including taking this down.
      </Text>
    </aside>
  );
}
