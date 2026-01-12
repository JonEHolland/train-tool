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
        <div className="card-body">
          <div className="no-service">
            <div className="no-service-message">No service today</div>
            <div className="no-service-subtitle">Sounder trains don't run on weekends</div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStop) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="no-service">
            <div className="no-service-message">Select a station</div>
            <div className="no-service-subtitle">Choose your departure stop above</div>
          </div>
        </div>
      </div>
    );
  }

  if (trainsByDirection.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="no-service">
            <div className="no-service-message">No trains available</div>
            <div className="no-service-subtitle">Check back later for upcoming departures</div>
          </div>
        </div>
      </div>
    );
  }

  // Combine all directions into one card
  return (
    <div className="card train-card">
      <div className="card-body">
        {trainsByDirection.map((direction, directionIndex) => {
          const [firstTrain, ...otherTrains] = direction.trains;

          // Determine urgency for first train - much more conservative
          let urgencyClass = '';
          if (!firstTrain.isTomorrow) {
            if (firstTrain.minutesAway <= 2) {
              urgencyClass = 'urgent';
            } else if (firstTrain.minutesAway <= 5) {
              urgencyClass = 'soon';
            }
          }

          const firstCountdown = firstTrain.isTomorrow
            ? 'Tomorrow'
            : formatCountdown(firstTrain.minutesAway);

          return (
            <div key={direction.directionName} className="train-direction-section">
              {/* Direction header */}
              <div className="train-direction-header">To {direction.directionName}</div>

              {/* Hero: Next Train - centered */}
              <div className={`train-hero ${urgencyClass}`}>
                <div className="train-hero-countdown">{firstCountdown}</div>
                <div className="train-hero-time">{formatTime(firstTrain.time)}</div>
              </div>

              {/* Secondary: Other trains */}
              {otherTrains.length > 0 && (
                <>
                  <div className="train-secondary-header">
                    <div className="train-secondary-title">Other Departures</div>
                  </div>
                  <div className="train-secondary-list">
                    {otherTrains.map((train, index) => {
                      const countdown = train.isTomorrow
                        ? 'tomorrow'
                        : formatCountdown(train.minutesAway);

                      return (
                        <div key={index} className="train-secondary-item">
                          <span className="train-secondary-time">{formatTime(train.time)}</span>
                          <span className="train-secondary-countdown">{countdown}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Add separator between directions, but not after last one */}
              {directionIndex < trainsByDirection.length - 1 && (
                <div className="train-direction-divider" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
