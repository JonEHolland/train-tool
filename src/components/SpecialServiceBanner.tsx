import { useExceptionService, type ExceptionServiceTheme } from '../context/ExceptionServiceContext';

interface BannerConfig {
  icon: string;
  title: string;
  subtitle: string;
}

/**
 * Banner displayed when exception service (gameday, fair, reduced, etc.) is active.
 * Subscribes to ExceptionServiceContext for theme - no props needed.
 */
export function SpecialServiceBanner() {
  const { theme } = useExceptionService();

  if (!theme) return null;

  const config = getBannerConfig(theme);

  return (
    <div className={`special-service-banner special-service-banner--${theme}`}>
      <span className="special-service-banner-icon">{config.icon}</span>
      <div className="special-service-banner-content">
        <span className="special-service-banner-title">{config.title}</span>
        <span className="special-service-banner-subtitle">{config.subtitle}</span>
      </div>
    </div>
  );
}

function getBannerConfig(theme: ExceptionServiceTheme): BannerConfig {
  switch (theme) {
    case 'seahawks':
      return {
        icon: '🏈',
        title: 'Seahawks Gameday Service',
        subtitle: 'Special trains running to King Street Station',
      };
    case 'mariners':
      return {
        icon: '⚾',
        title: 'Mariners Gameday Service',
        subtitle: 'Special trains running to King Street Station',
      };
    case 'gameday':
      return {
        icon: '🏈⚾',
        title: 'Gameday Service',
        subtitle: 'Special event trains in service',
      };
    case 'fair':
      return {
        icon: '🎡',
        title: 'State Fair Service',
        subtitle: 'Special trains to Puyallup',
      };
    case 'reduced':
      return {
        icon: '📅',
        title: 'Reduced Service',
        subtitle: 'Limited schedule in effect',
      };
    case 'special':
      return {
        icon: '⭐',
        title: 'Special Service',
        subtitle: 'Modified schedule in effect',
      };
  }
}
