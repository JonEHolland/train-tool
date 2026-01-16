export interface Stop {
  stopId: string;
  name: string;
}

export interface TripStop {
  stopId: string;
  name?: string;
  arrival?: string;
  departure: string;
}

export interface Trip {
  tripId?: string;
  serviceId?: string;
  headsign?: string;
  stops: TripStop[];
}

export interface Direction {
  name: string;
  trips: Trip[];
}

export interface Route {
  name: string;
  routeId: string;
  stops: Stop[];
  directions: Record<string, Direction>;
}

export interface Calendar {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_date: string;
  end_date: string;
}

export interface CalendarDate {
  date: string;
  exception_type: string;
}

export interface ScheduleData {
  schedule: Record<string, Route>;
  calendars?: Record<string, Calendar>;
  calendarDates?: Record<string, CalendarDate[]>;
  generatedAt: string;
}

/** Severity level for train-specific alerts */
export type AlertSeverity = 'delayed' | 'cancelled' | 'modified' | 'info';

/** Parsed train-specific alert information */
export interface TrainAlert {
  trainNumber: string;
  severity: AlertSeverity;
  message: string;
  delayMinutes?: number;
  alertId: string;
}

export interface NextTrain {
  destination: string;
  time: string;
  minutesAway: number;
  isTomorrow?: boolean;
  /** Timestamp when train entered "Departing" state (Date.now() value) */
  departingAt?: number;
  /** Train number extracted from tripId (e.g., "1700", "1820E") */
  trainNumber?: string;
  /** Attached alert if this train has a service alert */
  alert?: TrainAlert;
  /** Whether this train is from an exception-only service (gameday, fair, etc.) */
  isExceptionService?: boolean;
  /** Type of exception service if applicable */
  exceptionServiceType?: ExceptionServiceType;
}

export interface DirectionTrains {
  directionName: string;
  trains: NextTrain[];
}

/** Type of exception service based on service ID pattern */
export type ExceptionServiceType = 'gameday' | 'fair' | 'reduced' | 'special';

/**
 * Context about the current service state for a route.
 * Used to determine what empty state message to show.
 */
export interface ServiceContext {
  /** Whether any service is running today (regular or exception) */
  hasService: boolean;
  /** Whether active service includes exception-only services */
  hasExceptionService: boolean;
  /** Type of exception service if active (for UX treatment) */
  exceptionServiceType: ExceptionServiceType | null;
  /** Whether it's a weekend day with no service at all */
  isWeekendWithNoService: boolean;
}

export interface AlertTranslation {
  text: string;
  language?: string;
}

export interface AlertText {
  translation?: AlertTranslation[];
}

export interface InformedEntity {
  route_id?: string;
  stop_id?: string;
}

export interface Alert {
  header_text?: AlertText;
  description_text?: AlertText;
  informed_entity?: InformedEntity[];
}

export interface AlertEntity {
  id: string;
  alert?: Alert;
}

export interface AlertsResponse {
  entity?: AlertEntity[];
}
