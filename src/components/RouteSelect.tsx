import type { ScheduleData } from '../types';

interface RouteSelectProps {
  scheduleData: ScheduleData;
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export function RouteSelect({ scheduleData, currentRoute, onRouteChange }: RouteSelectProps) {
  return (
    <div className="route-select">
      <select
        value={currentRoute}
        onChange={(e) => onRouteChange(e.target.value)}
      >
        {Object.entries(scheduleData.schedule).map(([key, route]) => (
          <option key={key} value={key}>
            {route.name}
          </option>
        ))}
      </select>
    </div>
  );
}
