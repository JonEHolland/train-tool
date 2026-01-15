export interface ParsedTime {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Parse a time string in HH:MM or HH:MM:SS format.
 * @throws Error if the format is invalid or contains non-numeric values
 */
export function parseTime(timeStr: string): ParsedTime {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) {
    throw new Error(`Invalid time format: expected "HH:MM:SS" or "HH:MM", got "${timeStr}"`);
  }

  const parts = timeStr.split(':');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid time format: expected 2-3 parts, got ${parts.length}`);
  }

  const [h, m, s] = parts.map(Number);

  if (isNaN(h) || isNaN(m) || (parts.length === 3 && isNaN(s))) {
    throw new Error(`Invalid time format: non-numeric values in "${timeStr}"`);
  }

  return { hours: h, minutes: m, seconds: s || 0 };
}

export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

export function formatTime(timeStr: string): string {
  const { hours, minutes } = parseTime(timeStr);
  const h = hours % 24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function isWeekday(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

interface FormatCountdownOptions {
  /** Use compact format without "in" prefix (for hero display) */
  compact?: boolean;
}

/**
 * Format a countdown duration for display.
 * @param minutes - Minutes until departure
 * @param isDeparting - Whether the train is currently departing
 * @param options - Formatting options
 */
export function formatCountdown(
  minutes: number,
  isDeparting?: boolean,
  options: FormatCountdownOptions = {}
): string {
  const { compact = false } = options;

  if (isDeparting) return 'Departing';
  if (minutes < 1) return compact ? 'Now' : 'Departing now';

  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);

  if (minutes < 60) {
    return compact ? `${Math.round(minutes)}m` : `in ${Math.round(minutes)} min`;
  }

  return compact ? `${h}h ${m}m` : `in ${h}h ${m} min`;
}

/**
 * Compact countdown format without "in" prefix - for hero display.
 * @deprecated Use formatCountdown(minutes, isDeparting, { compact: true }) instead.
 */
export function formatCountdownCompact(minutes: number, isDeparting?: boolean): string {
  return formatCountdown(minutes, isDeparting, { compact: true });
}
