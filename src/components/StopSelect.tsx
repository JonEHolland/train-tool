import type { Stop } from '../types';

interface StopSelectProps {
  stops: Stop[];
  currentStop: string;
  onStopChange: (stopId: string) => void;
}

export function StopSelect({ stops, currentStop, onStopChange }: StopSelectProps) {
  return (
    <div className="stop-select">
      <div className="select-wrapper">
        <label htmlFor="stopSelect" className="select-label">Your Station</label>
        <select
          id="stopSelect"
          value={currentStop}
          onChange={(e) => onStopChange(e.target.value)}
          className="modern-select"
        >
          {stops.map(stop => (
            <option key={stop.stopId} value={stop.stopId}>
              {stop.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
