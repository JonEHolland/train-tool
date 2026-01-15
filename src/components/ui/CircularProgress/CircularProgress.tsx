import { useState, type ReactNode } from 'react';
import styles from './CircularProgress.module.css';

export interface CircularProgressProps {
  /** Progress value from 0 to 1 (1 = full, 0 = empty) */
  progress: number;
  /** Size of the component in pixels */
  size?: number;
  /** Stroke width of the ring */
  strokeWidth?: number;
  /** Color of the progress ring (CSS color or variable) */
  color?: string;
  /** Whether to show the track (background ring) */
  showTrack?: boolean;
  /** Glow intensity (0 = none, higher = more glow) */
  glowIntensity?: number;
  /** Content to display inside the ring */
  children?: ReactNode;
}

export function CircularProgress({
  progress,
  size = 180,
  strokeWidth = 6,
  color = 'var(--color-accent-primary)',
  showTrack = true,
  glowIntensity = 4,
  children,
}: CircularProgressProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Calculate circle dimensions - account for glow padding
  const glowPadding = glowIntensity * 3;
  const effectiveSize = size + glowPadding * 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  // Center point (adjusted for glow padding)
  const center = effectiveSize / 2;

  // Unique ID for SVG filter - generated once per component instance
  const [filterId] = useState(() => `glow-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className={styles.progress} style={{ width: size, height: size }}>
      <svg
        width={effectiveSize}
        height={effectiveSize}
        viewBox={`0 0 ${effectiveSize} ${effectiveSize}`}
        className={styles.svg}
        style={{
          margin: -glowPadding,
          overflow: 'visible',
        }}
      >
        {/* SVG filter for circular glow */}
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glowIntensity} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        {showTrack && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-surface-glass-border)"
            strokeWidth={strokeWidth}
            className={styles.track}
          />
        )}

        {/* Progress ring with SVG glow filter */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={styles.ring}
          filter={`url(#${filterId})`}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>

      {/* Content inside the ring */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
