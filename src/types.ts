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
}

export interface DirectionTrains {
  directionName: string;
  trains: NextTrain[];
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
