import type { ScheduleData } from '../types';

interface RouteSelectProps {
  scheduleData: ScheduleData;
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export function RouteSelect({ scheduleData, currentRoute, onRouteChange }: RouteSelectProps) {
  const routes = Object.entries(scheduleData.schedule);

  // Parse route name into title and subtitle
  const parseRouteName = (name: string) => {
    const match = name.match(/^(.+?)\s*\((.+)\)$/);
    if (match) {
      return { title: match[1], subtitle: match[2] };
    }
    return { title: name, subtitle: '' };
  };

  return (
    <div className="route-select">
      <div className="segmented-control">
        {routes.map(([key, route]) => {
          const { title, subtitle } = parseRouteName(route.name);
          return (
            <button
              key={key}
              className={`segment ${currentRoute === key ? 'active' : ''}`}
              onClick={() => onRouteChange(key)}
            >
              <span className="segment-title">{title}</span>
              {subtitle && <span className="segment-subtitle">{subtitle}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
