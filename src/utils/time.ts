interface ParsedTime {
  hours: number;
  minutes: number;
  seconds: number;
}

export function parseTime(timeStr: string): ParsedTime {
  const [h, m, s] = timeStr.split(':').map(Number);
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

export function formatCountdown(minutes: number, isDeparting?: boolean): string {
  if (isDeparting) return 'Departing';
  if (minutes < 1) return 'Departing now';
  if (minutes < 60) return `in ${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `in ${h}h ${m} min`;
}

/** Compact countdown format without "in" prefix - for hero display */
export function formatCountdownCompact(minutes: number, isDeparting?: boolean): string {
  if (isDeparting) return 'Departing';
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}
