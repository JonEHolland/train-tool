import type { AlertEntity, AlertSeverity, TrainAlert } from '../types';

/**
 * Result of parsing alerts - separates train-specific from general alerts
 */
export interface ParsedAlerts {
  /** Map of train number to alert info for O(1) lookup */
  trainAlerts: Map<string, TrainAlert>;
  /** Alerts that couldn't be matched to specific trains */
  generalAlerts: AlertEntity[];
}

/**
 * Patterns to extract train numbers from alert text.
 *
 * Sounder train numbers are typically 4 digits, sometimes with a letter suffix (e.g., "1820E").
 * All patterns use capture groups to extract the train number(s).
 * The extractTrainNumbers function iterates all capture groups to collect matches.
 *
 * Pattern priority order (first match wins for each position):
 * 1. Standard format: "Train 1700", "Train #1511"
 * 2. Sounder prefix: "Sounder train #1511"
 * 3. Line start: "1702: Running late"
 * 4. Hashtag only: "#1700"
 * 5. Multiple trains: "Trains 1700, 1702, and 1704"
 */
const TRAIN_NUMBER_PATTERNS = [
  /[Tt]rain\s*#?(\d{4}[A-Z]?)/g,           // Standard: "Train 1700", "Train #1511", "train #1700"
  /[Ss]ounder\s+train\s*#?(\d{4}[A-Z]?)/g, // Sounder prefix: "Sounder train #1511"
  /(?:^|\s)(\d{4}[A-Z]?):/gm,              // Line start: "1702: Running late"
  /#(\d{4}[A-Z]?)\b/g,                      // Hashtag: "#1700" standalone
  /[Tt]rains?\s+(\d{4}[A-Z]?)(?:,\s*(\d{4}[A-Z]?))*(?:,?\s*and\s+(\d{4}[A-Z]?))?/g, // Multiple: "Trains 1700, 1702, and 1704"
];

/**
 * Maximum reasonable delay in minutes for alert parsing.
 * Delays reported greater than this are likely parsing errors or data issues.
 */
const MAX_REASONABLE_DELAY_MINUTES = 180;

/**
 * Severity ranking - higher number = more severe.
 * Used for comparing alert severity when multiple alerts affect the same train.
 */
export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  cancelled: 4,
  delayed: 3,
  modified: 2,
  info: 1,
} as const;

/**
 * Severity order from most to least severe, derived from SEVERITY_RANK.
 */
const SEVERITY_ORDER: AlertSeverity[] = (
  Object.entries(SEVERITY_RANK) as [AlertSeverity, number][]
)
  .sort((a, b) => b[1] - a[1])
  .map(([severity]) => severity);

/**
 * Keywords to classify alert severity.
 * Order matters: cancelled is most severe, then delayed, then modified, then info (default).
 */
const SEVERITY_KEYWORDS: Record<AlertSeverity, string[]> = {
  cancelled: ['cancel', 'cancelled', 'cancellation', 'not operating', 'suspended', 'out of service'],
  delayed: ['delay', 'delayed', 'late', 'behind schedule', 'running late', 'minutes late', 'minutes behind'],
  modified: ['modified', 'skip', 'skipping', 'express', 'extra stop', 'no stop', 'alternate', 'reroute'],
  info: ['advisory', 'reminder', 'information', 'notice', 'alert'],
};

/**
 * Patterns to extract delay duration in minutes.
 */
const DELAY_PATTERNS = [
  /(\d+)\s*min(?:ute)?s?\s*(?:late|delay|behind)/i,
  /delay(?:ed)?\s*(?:by\s*)?(\d+)\s*min/i,
  /running\s*(\d+)\s*min(?:ute)?s?\s*(?:late|behind)/i,
  /(\d+)\s*min(?:ute)?s?\s*(?:delay|late)/i,
  /approximately\s*(\d+)\s*min/i,
];

/**
 * Extract all train numbers mentioned in the text.
 */
export function extractTrainNumbers(text: string): string[] {
  const numbers = new Set<string>();

  for (const pattern of TRAIN_NUMBER_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Capture groups may be at different positions depending on pattern
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          numbers.add(match[i]);
        }
      }
    }
  }

  return Array.from(numbers);
}

/**
 * Classify the severity of an alert based on keywords in the text.
 * Returns the most severe classification found.
 */
export function classifySeverity(text: string): AlertSeverity {
  const lowerText = text.toLowerCase();

  // Check in order of severity (most severe first)
  for (const severity of SEVERITY_ORDER) {
    const keywords = SEVERITY_KEYWORDS[severity];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return severity;
      }
    }
  }

  // Default to info if no keywords match
  return 'info';
}

/**
 * Extract the delay duration in minutes from text, if mentioned.
 */
export function extractDelayMinutes(text: string): number | undefined {
  for (const pattern of DELAY_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const minutes = parseInt(match[1], 10);
      if (!isNaN(minutes) && minutes > 0 && minutes < MAX_REASONABLE_DELAY_MINUTES) {
        return minutes;
      }
    }
  }
  return undefined;
}

/**
 * Get the text content from an alert entity.
 */
function getAlertText(alert: AlertEntity): string {
  const header = alert.alert?.header_text?.translation?.[0]?.text || '';
  const description = alert.alert?.description_text?.translation?.[0]?.text || '';
  return `${header} ${description}`.trim();
}

/**
 * Format a human-readable alert message based on severity and delay.
 */
export function formatAlertMessage(severity: AlertSeverity, delayMinutes?: number): string {
  switch (severity) {
    case 'cancelled':
      return 'Cancelled';
    case 'delayed':
      return delayMinutes ? `Running ${delayMinutes}m late` : 'Delayed';
    case 'modified':
      return 'Modified service';
    case 'info':
    default:
      return 'Service alert';
  }
}

/**
 * Parse an array of alert entities to extract train-specific alerts.
 * Returns a map of train numbers to their alerts, plus any general alerts.
 */
export function parseTrainAlerts(alerts: AlertEntity[]): ParsedAlerts {
  const trainAlerts = new Map<string, TrainAlert>();
  const generalAlerts: AlertEntity[] = [];

  for (const entity of alerts) {
    const text = getAlertText(entity);
    if (!text) continue;

    const trainNumbers = extractTrainNumbers(text);
    const severity = classifySeverity(text);
    const delayMinutes = severity === 'delayed' ? extractDelayMinutes(text) : undefined;

    // All alerts go to generalAlerts for the SERVICE ALERTS card (full context)
    generalAlerts.push(entity);

    // Alerts with train numbers ALSO get parsed for inline display
    if (trainNumbers.length > 0) {
      for (const trainNumber of trainNumbers) {
        // If train already has an alert, keep the more severe one
        const existing = trainAlerts.get(trainNumber);

        if (!existing || SEVERITY_RANK[severity] > SEVERITY_RANK[existing.severity]) {
          trainAlerts.set(trainNumber, {
            trainNumber,
            severity,
            message: formatAlertMessage(severity, delayMinutes),
            delayMinutes,
            alertId: entity.id,
          });
        }
      }
    }
  }

  return { trainAlerts, generalAlerts };
}
