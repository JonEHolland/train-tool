import type { SportsTeam } from '../utils/parseTrainAlerts';

export type GamedayTheme = SportsTeam | 'generic';

interface GamedayBannerProps {
  /** The team theme to apply, or 'generic' for non-team gameday */
  theme: GamedayTheme;
  /** Whether to show the banner */
  visible: boolean;
}

/**
 * Banner displayed when gameday train service is active for today.
 * Themed based on detected team from alerts.
 */
export function GamedayBanner({ theme, visible }: GamedayBannerProps) {
  if (!visible) return null;

  const icon = getIcon(theme);
  const text = getText(theme);

  return (
    <div className={`gameday-banner gameday-banner--${theme}`}>
      <span className="gameday-banner-icon">{icon}</span>
      <span className="gameday-banner-text">{text}</span>
    </div>
  );
}

function getIcon(theme: GamedayTheme): string {
  switch (theme) {
    case 'seahawks':
      return '🏈';
    case 'mariners':
      return '⚾';
    case 'generic':
    default:
      return '🏈⚾';
  }
}

function getText(theme: GamedayTheme): string {
  switch (theme) {
    case 'seahawks':
      return 'Seahawks Gameday';
    case 'mariners':
      return 'Mariners Gameday';
    case 'generic':
    default:
      return 'Gameday Train';
  }
}
