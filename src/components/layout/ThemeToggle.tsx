import type { ThemePreference, ThemeMode } from "../../utils/theme";

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
  let icon = "🖥️";
  let label = `Current theme: System (${resolvedTheme}). Switch to light mode.`;

  if (preference === "light") {
    icon = "☀️";
    label = "Current theme: Light. Switch to dark mode.";
  } else if (preference === "dark") {
    icon = "🌙";
    label = "Current theme: Dark. Switch to system mode.";
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
