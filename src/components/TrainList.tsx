import { useState, useEffect } from 'react';
import type { DirectionTrains } from '../types';
import { formatTime, formatCountdown, formatCountdownCompact } from '../utils/time';
import { CircularProgress, calculateProgress, getUrgencyColor } from './CircularProgress';

interface TrainListProps {
  trainsByDirection: DirectionTrains[];
  isWeekend: boolean;
  hasStop: boolean;
  currentRoute?: string;
}

export function TrainList({ trainsByDirection, isWeekend, hasStop, currentRoute }: TrainListProps) {
  const [activeTab, setActiveTab] = useState(0);

  // Reset tab when directions change (e.g., route or stop change)
  useEffect(() => {
    setActiveTab(0);
  }, [trainsByDirection.map(d => d.directionName).join(',')]);

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

  const hasMultipleDirections = trainsByDirection.length > 1;
  const currentDirection = trainsByDirection[activeTab] || trainsByDirection[0];

  // Get direction arrow based on direction name and current route
  const getDirectionArrow = (directionName: string) => {
    const name = directionName.toLowerCase();
    // Northbound destinations (going north)
    if (name.includes('everett') || name.includes('edmonds') || name.includes('mukilteo')) {
      return '↑';
    }
    // Southbound destinations (going south)
    if (name.includes('tacoma') || name.includes('lakewood') || name.includes('kent') ||
        name.includes('auburn') || name.includes('puyallup') || name.includes('sumner') ||
        name.includes('tukwila')) {
      return '↓';
    }
    // King Street/Seattle - direction depends on which line we're on
    if (name.includes('seattle') || name.includes('king')) {
      // N-Line: King Street is south of the other stations → going south
      // S-Line: King Street is north of the other stations → going north
      return currentRoute === 'n-line' ? '↓' : '↑';
    }
    return '';
  };

  const renderDirection = (direction: DirectionTrains) => {
    const [firstTrain, ...otherTrains] = direction.trains;

    // Determine urgency for first train
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
      : formatCountdownCompact(firstTrain.minutesAway);

    const progress = firstTrain.isTomorrow ? 1 : calculateProgress(firstTrain.minutesAway);
    const ringColor = firstTrain.isTomorrow
      ? 'var(--color-accent-primary)'
      : getUrgencyColor(firstTrain.minutesAway);

    const directionArrow = getDirectionArrow(direction.directionName);

    return (
      <div className="train-direction-section">
        {/* Direction header with arrow */}
        <div className="train-direction-header">
          {directionArrow && <span className="direction-arrow">{directionArrow}</span>}
          <span>To {direction.directionName}</span>
        </div>

        {/* Hero: Next Train with circular progress */}
        <div className={`train-hero ${urgencyClass}`}>
          <CircularProgress
            progress={progress}
            color={ringColor}
            size={180}
            strokeWidth={6}
          >
            <div className="train-hero-inner">
              <div className={`train-hero-countdown ${firstTrain.isTomorrow ? 'tomorrow' : ''}`}>
                {firstCountdown}
              </div>
              <div className="train-hero-time">{formatTime(firstTrain.time)}</div>
            </div>
          </CircularProgress>
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
      </div>
    );
  };

  return (
    <div className="card train-card">
      {/* Destination tabs for multiple directions */}
      {hasMultipleDirections && (
        <div className="destination-tabs">
          {trainsByDirection.map((direction, index) => {
            const arrow = getDirectionArrow(direction.directionName);
            // Extract short name (e.g., "Tacoma Dome Station" -> "Tacoma")
            const shortName = direction.directionName.split(' ')[0];

            return (
              <button
                key={direction.directionName}
                className={`destination-tab ${index === activeTab ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {arrow && <span className="tab-arrow">{arrow}</span>}
                <span className="tab-name">{shortName}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="card-body">
        <div className="direction-content">
          {renderDirection(currentDirection)}
        </div>
      </div>
    </div>
  );
}
