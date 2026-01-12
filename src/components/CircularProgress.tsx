interface CircularProgressProps {
  /** Progress value from 0 to 1 (1 = full, 0 = empty) */
  progress: number;
  /** Size of the component in pixels */
  size?: number;
  /** Stroke width of the ring */
  strokeWidth?: number;
  /** Color of the progress ring */
  color?: string;
  /** Whether to show the track (background ring) */
  showTrack?: boolean;
  /** Glow intensity (0 = none, higher = more glow) */
  glowIntensity?: number;
  /** Content to display inside the ring */
  children: React.ReactNode;
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

  // Unique ID for SVG filter
  const filterId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg
        width={effectiveSize}
        height={effectiveSize}
        viewBox={`0 0 ${effectiveSize} ${effectiveSize}`}
        className="circular-progress-svg"
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
            className="circular-progress-track"
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
          className="circular-progress-ring"
          filter={`url(#${filterId})`}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>

      {/* Content inside the ring */}
      <div className="circular-progress-content">
        {children}
      </div>
    </div>
  );
}

/** Helper to calculate progress based on minutes away */
export function calculateProgress(minutesAway: number): number {
  // Max time for full ring (60 minutes)
  const maxMinutes = 60;

  if (minutesAway >= maxMinutes) return 1;
  if (minutesAway <= 0) return 0;

  return minutesAway / maxMinutes;
}

/** Helper to get color based on urgency */
export function getUrgencyColor(minutesAway: number): string {
  if (minutesAway <= 2) return 'var(--color-status-danger)';
  if (minutesAway <= 5) return 'var(--color-status-warning)';
  if (minutesAway <= 15) return 'var(--color-accent-secondary)';
  return 'var(--color-accent-primary)';
}
