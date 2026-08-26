export interface ThemeToggleProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function ThemeToggle({ currentTheme, onToggleTheme }: ThemeToggleProps) {
  const nextThemeLabel = currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';

  return (
    <div className="theme-toggle-fixed-wrap">
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        aria-label={nextThemeLabel}
        title={nextThemeLabel}
      >
        <span aria-hidden="true">{currentTheme === 'light' ? '☀️' : '🌙'}</span>
      </button>
    </div>
  );
}
