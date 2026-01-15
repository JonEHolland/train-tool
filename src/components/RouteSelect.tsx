import { memo } from 'react';
import type { ScheduleData } from '../types';
import { SegmentedControl } from './ui';

interface RouteSelectProps {
  scheduleData: ScheduleData;
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export const RouteSelect = memo(function RouteSelect({ scheduleData, currentRoute, onRouteChange }: RouteSelectProps) {
  const routes = Object.entries(scheduleData.schedule);

  // Parse route name into title and subtitle
  const parseRouteName = (name: string) => {
    const match = name.match(/^(.+?)\s*\((.+)\)$/);
    if (match) {
      return { title: match[1], subtitle: match[2] };
    }
    return { title: name, subtitle: '' };
  };

  const options = routes.map(([key, route]) => {
    const { title, subtitle } = parseRouteName(route.name);
    return {
      value: key,
      title,
      subtitle: subtitle || undefined,
    };
  });

  return (
    <div className="route-select">
      <SegmentedControl
        options={options}
        value={currentRoute}
        onChange={onRouteChange}
      />
    </div>
  );
});
