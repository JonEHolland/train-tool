import { useState, useRef, useCallback } from 'react';
import type { AlertEntity } from '../types';
import { Card, CardBody, Label, Button, EmptyState } from './ui';

interface AlertListProps {
  alerts: AlertEntity[];
  loading: boolean;
  error: string | null;
}

export function AlertList({ alerts, loading, error }: AlertListProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Navigation functions
  const nextAlert = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, alerts.length - 1));
  }, [alerts.length]);

  const prevAlert = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  const goToAlert = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const SWIPE_THRESHOLD = 50;

    if (diff > SWIPE_THRESHOLD) {
      nextAlert(); // Swipe left - go to next
    } else if (diff < -SWIPE_THRESHOLD) {
      prevAlert(); // Swipe right - go to previous
    }
  };

  // Handle loading and error states
  if (loading) {
    return (
      <Card className="alert-card">
        <CardBody>
          <div className="loading">Loading alerts...</div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="alert-card">
        <CardBody>
          <div className="error">{error}</div>
        </CardBody>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="alert-card">
        <CardBody>
          <EmptyState
            title="No active alerts"
            subtitle="All systems operating normally"
          />
        </CardBody>
      </Card>
    );
  }

  // Get current alert data
  const currentEntity = alerts[currentIndex];
  const alert = currentEntity?.alert;
  const header = alert?.header_text?.translation?.[0]?.text || 'Alert';
  const desc = alert?.description_text?.translation?.[0]?.text || '';
  const truncatedDesc = desc.length > 200 ? `${desc.slice(0, 200)}...` : desc;

  return (
    <Card className="alert-card alert-carousel">
      <div className="alert-carousel-header">
        <Label>SERVICE ALERTS</Label>
        {alerts.length > 1 && (
          <div className="alert-dots">
            {alerts.map((_, index) => (
              <button
                key={index}
                className={`alert-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToAlert(index)}
                aria-label={`Go to alert ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      <div
        className="alert-carousel-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="alert-header">{header}</div>
        <div className="alert-desc">{truncatedDesc}</div>
        {alerts.length > 1 && (
          <div className="alert-swipe-hint">
            Swipe for more alerts ({currentIndex + 1}/{alerts.length})
          </div>
        )}
      </div>
      {/* Arrow navigation for desktop - only show if there's an alert in that direction */}
      {alerts.length > 1 && currentIndex > 0 && (
        <Button
          variant="icon"
          className="alert-nav-arrow alert-nav-prev"
          onClick={prevAlert}
          aria-label="Previous alert"
        >
          ‹
        </Button>
      )}
      {alerts.length > 1 && currentIndex < alerts.length - 1 && (
        <Button
          variant="icon"
          className="alert-nav-arrow alert-nav-next"
          onClick={nextAlert}
          aria-label="Next alert"
        >
          ›
        </Button>
      )}
    </Card>
  );
}
