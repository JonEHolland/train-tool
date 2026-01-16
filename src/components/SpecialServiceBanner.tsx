import { useExceptionService, type ExceptionServiceTheme } from '../context/ExceptionServiceContext';

/**
 * Banner displayed when exception service (gameday, fair, reduced, etc.) is active.
 * Subscribes to ExceptionServiceContext for theme - no props needed.
 */
export function SpecialServiceBanner() {
  const { theme } = useExceptionService();

  if (!theme) return null;

  const icon = getIcon(theme);
  const text = getText(theme);

  return (
    <div className={`special-service-banner special-service-banner--${theme}`}>
      <span className="special-service-banner-icon">{icon}</span>
      <span className="special-service-banner-text">{text}</span>
    </div>
  );
}

function getIcon(theme: ExceptionServiceTheme): string {
  switch (theme) {
    case 'seahawks':
      return '🏈';
    case 'mariners':
      return '⚾';
    case 'gameday':
      return '🏈⚾';
    case 'fair':
      return '🎡';
    case 'reduced':
      return '📅';
    case 'special':
      return '⭐';
  }
}

function getText(theme: ExceptionServiceTheme): string {
  switch (theme) {
    case 'seahawks':
      return 'Seahawks Gameday';
    case 'mariners':
      return 'Mariners Gameday';
    case 'gameday':
      return 'Gameday Service';
    case 'fair':
      return 'State Fair Service';
    case 'reduced':
      return 'Reduced Service';
    case 'special':
      return 'Special Service';
  }
}
