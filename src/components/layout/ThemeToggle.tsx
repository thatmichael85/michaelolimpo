import type { ThemePreference, ThemeMode } from '../../utils/theme';

export interface ThemeToggleProps {
  preference: ThemePreference;
  resolvedTheme: ThemeMode;
  onToggleTheme: () => void;
}

export function ThemeToggle({
  preference,
  resolvedTheme,
  onToggleTheme,
}: ThemeToggleProps) {
  let icon = '🖥️';
  let label = `Theme: System (${resolvedTheme}) · Click for Light Mode`;

  if (preference === 'light') {
    icon = '☀️';
    label = 'Theme: Light · Click for Dark Mode';
  } else if (preference === 'dark') {
    icon = '🌙';
    label = 'Theme: Dark · Click for System Mode';
  }

  return (
    <div className="theme-toggle-fixed-wrap">
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        aria-label={label}
        title={label}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    </div>
  );
}
