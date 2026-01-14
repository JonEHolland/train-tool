import type { Stop } from '../types';
import { Select } from './ui';

interface StopSelectProps {
  stops: Stop[];
  currentStop: string;
  onStopChange: (stopId: string) => void;
}

export function StopSelect({ stops, currentStop, onStopChange }: StopSelectProps) {
  const options = stops.map(stop => ({
    value: stop.stopId,
    label: stop.name,
  }));

  return (
    <div className="stop-select">
      <Select
        label="Your Station"
        options={options}
        value={currentStop}
        onChange={onStopChange}
      />
    </div>
  );
}
