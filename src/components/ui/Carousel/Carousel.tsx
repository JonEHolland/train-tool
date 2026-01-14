import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Button } from '../Button';
import styles from './Carousel.module.css';

export interface CarouselProps {
  children: ReactNode[];
  showDots?: boolean;
  showArrows?: boolean;
  swipeThreshold?: number;
  className?: string;
}

export function Carousel({
  children,
  showDots = true,
  showArrows = true,
  swipeThreshold = 50,
  className = '',
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    if (diff > swipeThreshold) {
      next();
    } else if (diff < -swipeThreshold) {
      prev();
    }
  };

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className={`${styles.carousel} ${className}`.trim()}>
      <div
        className={styles.content}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="carousel-content"
      >
        {children[currentIndex]}
      </div>

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

      {itemCount > 1 && (
        <div className={styles.hint}>
          Swipe for more ({currentIndex + 1}/{itemCount})
        </div>
      )}
    </div>
  );
}
