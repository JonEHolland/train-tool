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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Touch handlers for swipe navigation with drag feedback
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Limit drag at edges
    if ((currentIndex === 0 && diff > 0) ||
        (currentIndex === alerts.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3); // Rubber band effect
    } else {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const SWIPE_THRESHOLD = 50;

    if (dragOffset < -SWIPE_THRESHOLD && currentIndex < alerts.length - 1) {
      nextAlert(); // Swipe left - go to next
    } else if (dragOffset > SWIPE_THRESHOLD && currentIndex > 0) {
      prevAlert(); // Swipe right - go to previous
    }

    setDragOffset(0);
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

  // Calculate transform for sliding effect
  const baseOffset = -currentIndex * 100;
  const containerWidth = containerRef.current?.offsetWidth || 300;
  const dragPercent = (dragOffset / containerWidth) * 100;
  const translateX = baseOffset + dragPercent;

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
        ref={containerRef}
        className="alert-carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="alert-carousel-track"
          style={{
            transform: `translateX(${translateX}%)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {alerts.map((entity, index) => {
            const alertData = entity?.alert;
            const header = alertData?.header_text?.translation?.[0]?.text || 'Alert';
            const desc = alertData?.description_text?.translation?.[0]?.text || '';
            const truncatedDesc = desc.length > 200 ? `${desc.slice(0, 200)}...` : desc;

            return (
              <div key={index} className="alert-carousel-slide">
                <div className="alert-header">{header}</div>
                <div className="alert-desc">{truncatedDesc}</div>
                {alerts.length > 1 && (
                  <div className="alert-swipe-hint">
                    Swipe for more alerts ({index + 1}/{alerts.length})
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
