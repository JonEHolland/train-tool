import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Button } from '../Button';
import styles from './Carousel.module.css';

export interface CarouselProps {
  children: ReactNode[];
  header?: ReactNode;
  showDots?: boolean;
  showArrows?: boolean;
  showHint?: boolean;
  hintText?: string;
  swipeThreshold?: number;
  className?: string;
}

export function Carousel({
  children,
  header,
  showDots = true,
  showArrows = true,
  showHint = true,
  hintText = 'Swipe for more',
  swipeThreshold = 50,
  className = '',
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemCount = children.length;

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, itemCount - 1));
  }, [itemCount]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Rubber band effect at edges
    if ((currentIndex === 0 && diff > 0) ||
        (currentIndex === itemCount - 1 && diff < 0)) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (dragOffset < -swipeThreshold && currentIndex < itemCount - 1) {
      next();
    } else if (dragOffset > swipeThreshold && currentIndex > 0) {
      prev();
    }

    setDragOffset(0);
  };

  if (itemCount === 0) {
    return null;
  }

  // Optimize: single item doesn't need carousel UI
  if (itemCount === 1) {
    return (
      <div className={`${styles.carousel} ${className}`.trim()}>
        {header && (
          <div className={styles.header}>
            <div className={styles.headerSlot}>{header}</div>
          </div>
        )}
        <div className={styles.viewport}>
          <div className={styles.slide}>{children[0]}</div>
        </div>
      </div>
    );
  }

  // Calculate transform for sliding effect
  const baseOffset = -currentIndex * 100;
  const containerWidth = containerRef.current?.offsetWidth || 300;
  const dragPercent = (dragOffset / containerWidth) * 100;
  const translateX = baseOffset + dragPercent;

  return (
    <div className={`${styles.carousel} ${className}`.trim()}>
      {(header || (showDots && itemCount > 1)) && (
        <div className={styles.header}>
          {header && <div className={styles.headerSlot}>{header}</div>}
          {showDots && itemCount > 1 && (
            <div className={styles.dots}>
              {children.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
                  onClick={() => goTo(index)}
                  aria-label={`Go to item ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={styles.viewport}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="carousel-content"
      >
        <div
          className={styles.track}
          style={{
            transform: `translateX(${translateX}%)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {children.map((child, index) => (
            <div key={index} className={styles.slide}>
              {child}
            </div>
          ))}
        </div>

        {showArrows && itemCount > 1 && (
          <>
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                className={`${styles.arrow} ${styles.arrowPrev}`}
                onClick={prev}
                aria-label="Previous"
              >
                ‹
              </Button>
            )}
            {currentIndex < itemCount - 1 && (
              <Button
                variant="ghost"
                className={`${styles.arrow} ${styles.arrowNext}`}
                onClick={next}
                aria-label="Next"
              >
                ›
              </Button>
            )}
          </>
        )}
      </div>

      {showHint && itemCount > 1 && (
        <div className={styles.hint}>
          {hintText} ({currentIndex + 1}/{itemCount})
        </div>
      )}
    </div>
  );
}
