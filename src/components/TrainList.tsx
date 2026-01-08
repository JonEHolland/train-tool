import type { DirectionTrains } from '../types';
import { formatTime, formatCountdown } from '../utils/time';

interface TrainListProps {
  trainsByDirection: DirectionTrains[];
  isWeekend: boolean;
  hasStop: boolean;
}

export function TrainList({ trainsByDirection, isWeekend, hasStop }: TrainListProps) {
  if (isWeekend) {
    return (
      <div className="card">
        <div className="card-header">Next Trains</div>
        <div className="card-body">
          <div className="no-service">No service today</div>
        </div>
      </div>
    );
  }

  if (!hasStop) {
    return (
      <div className="card">
        <div className="card-header">Next Trains</div>
        <div className="card-body">
          <div className="no-service">Select a station</div>
        </div>
      </div>
    );
  }

  if (trainsByDirection.length === 0) {
    return (
      <div className="card">
        <div className="card-header">Next Trains</div>
        <div className="card-body">
          <div className="no-service">No trains available</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {trainsByDirection.map((direction) => (
        <div key={direction.directionName} className="card">
          <div className="card-header">To {direction.directionName}</div>
          <div className="card-body">
            {direction.trains.map((train, index) => {
              const countdownClass = !train.isTomorrow && train.minutesAway < 15 ? 'soon' : '';
              const countdownText = train.isTomorrow
                ? `tomorrow`
                : formatCountdown(train.minutesAway);

              return (
                <div key={index} className="train-item">
                  <div className="train-time-main">
                    <div className="time">{formatTime(train.time)}</div>
                  </div>
                  <div className={`countdown ${countdownClass}`}>
                    {countdownText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
