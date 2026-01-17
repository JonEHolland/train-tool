import type { ScheduleData, NextTrain, DirectionTrains, ServiceContext, ExceptionServiceType } from '../types';
import { timeToMinutes, getCurrentMinutes } from './time';
import { extractTrainNumber } from './trainNumber';

const MINUTES_IN_DAY = 24 * 60;

/**
 * Checks if a service ID represents an exception-only service.
 * Exception-only services have no base calendar entry (or all days false)
 * and are activated only via exception_type: "1" entries.
 */
export function isExceptionOnlyService(
  serviceId: string,
  data: ScheduleData
): boolean {
  const calendar = data.calendars?.[serviceId];

  // No calendar entry at all = exception-only
  if (!calendar) {
    return true;
  }

  // All days false = exception-only (activated only by exceptions)
  const hasAnyRegularDay =
    calendar.monday ||
    calendar.tuesday ||
    calendar.wednesday ||
    calendar.thursday ||
    calendar.friday ||
    calendar.saturday ||
    calendar.sunday;

  return !hasAnyRegularDay;
}

/**
 * Classifies an exception service type based on service ID patterns.
 * Used for UX treatment (icons, banners, labels).
 */
export function classifyExceptionServiceType(
  serviceId: string
): ExceptionServiceType {
  const upperServiceId = serviceId.toUpperCase();

  if (upperServiceId.includes('GAMEDAY')) {
    return 'gameday';
  }
  if (upperServiceId.includes('WSF')) {
    return 'fair';
  }
  if (upperServiceId.includes('REDUCED')) {
    return 'reduced';
  }
  return 'special';
}

/**
 * Gets the service context for a route, including exception service detection.
 * Used to determine what empty state message to show and whether to display gameday banners.
 *
 * @param data - The schedule data
 * @param route - The route to check service for (e.g., 'n-line', 's-line')
 */
export function getServiceContext(
  data: ScheduleData,
  route: string
): ServiceContext {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Get active services and filter to ones used by this route
  const activeServices = getActiveServices(data);
  const routeSchedule = data.schedule[route];
  const routeServiceIds = new Set<string>();

  if (routeSchedule) {
    for (const direction of Object.values(routeSchedule.directions)) {
      for (const trip of direction.trips) {
        if (trip.serviceId && activeServices.has(trip.serviceId)) {
          routeServiceIds.add(trip.serviceId);
        }
      }
    }
  }

  // hasService indicates if there's same-day service (not including preview trains)
  const hasService = routeServiceIds.size > 0;

  // Check if any active route service is exception-only
  let hasExceptionService = false;
  let exceptionServiceType: ExceptionServiceType | null = null;

  for (const serviceId of routeServiceIds) {
    if (isExceptionOnlyService(serviceId, data)) {
      hasExceptionService = true;
      // Classify the type (prioritize gameday over others)
      const type = classifyExceptionServiceType(serviceId);
      if (!exceptionServiceType || type === 'gameday') {
        exceptionServiceType = type;
      }
    }
  }

  return {
    hasService,
    hasExceptionService,
    exceptionServiceType,
    isWeekendWithNoService: isWeekend && !hasService,
  };
}

/**
 * Determines which service IDs are active for a given date based on calendar rules
 * and date exceptions.
 *
 * @param data - The schedule data containing calendars and exceptions
 * @param date - The date to check (defaults to current date)
 */
export function getActiveServices(data: ScheduleData, date?: Date): Set<string> {
  const targetDate = date ?? new Date();
  // Use local date components, not UTC
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`; // YYYYMMDD in local time
  const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, ...
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const todayName = dayNames[dayOfWeek];

  const activeServices = new Set<string>();

  // Check regular calendars
  if (data.calendars) {
    for (const [serviceId, calendar] of Object.entries(data.calendars)) {
      // Check if today is within the date range
      if (dateStr >= calendar.start_date && dateStr <= calendar.end_date) {
        // Check if service runs on this day of week
        if (calendar[todayName]) {
          activeServices.add(serviceId);
        }
      }
    }
  }

  // Apply calendar date exceptions
  if (data.calendarDates) {
    for (const [serviceId, exceptions] of Object.entries(data.calendarDates)) {
      for (const exception of exceptions) {
        if (exception.date === dateStr) {
          if (exception.exception_type === '1') {
            // Service added for this date
            activeServices.add(serviceId);
          } else if (exception.exception_type === '2') {
            // Service removed for this date
            activeServices.delete(serviceId);
          }
        }
      }
    }
  }

  return activeServices;
}

/** Result from findNextServiceDay with date info and display label */
export interface NextServiceDayResult {
  /** The date when the service next runs */
  date: Date;
  /** Number of days from startDate (0 = same day, 1 = tomorrow, etc.) */
  daysAway: number;
  /** Display label: "" for today, "Tomorrow" for next day, day name for further */
  dayLabel: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/**
 * Finds the next day a service runs, starting from a given date.
 * Checks up to 7 days ahead (one full week).
 *
 * This correctly handles:
 * - Regular calendar services (weekday schedules)
 * - Exception-only services (gameday, fair, etc.) via calendarDates exceptions
 * - Both exception_type "1" (service added) and "2" (service removed)
 *
 * @param data - The schedule data
 * @param serviceId - The service ID to check
 * @param startDate - The date to start checking from
 * @returns The next service day info, or null if no service within 7 days
 */
export function findNextServiceDay(
  data: ScheduleData,
  serviceId: string,
  startDate: Date
): NextServiceDayResult | null {
  for (let daysAway = 0; daysAway <= 7; daysAway++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + daysAway);

    const activeServices = getActiveServices(data, checkDate);
    if (activeServices.has(serviceId)) {
      let dayLabel: string;
      if (daysAway === 0) {
        dayLabel = '';
      } else if (daysAway === 1) {
        dayLabel = 'Tomorrow';
      } else {
        dayLabel = DAY_NAMES[checkDate.getDay()];
      }

      return {
        date: checkDate,
        daysAway,
        dayLabel,
      };
    }
  }

  return null;
}

/**
 * Gets trains grouped by direction/terminus for a given route and stop.
 * Calculates minutes away and handles smart day wrapping for future trains.
 *
 * Features:
 * - Shows trains for services running today
 * - Previews trains for exception services (gameday, fair, etc.) running within 7 days
 * - For trains that have passed today, finds the next day the service runs
 * - Shows day label: "Tomorrow", "Monday", etc. for future-day trains
 * - Skips trains whose service doesn't run within 7 days
 */
export function getTrainsByDirection(
  data: ScheduleData,
  route: string,
  stopId: string
): DirectionTrains[] {
  const schedule = data.schedule[route];
  if (!schedule) return [];

  const now = new Date();
  const nowMinutes = getCurrentMinutes();

  // Group trains by their terminus (headsign)
  const trainsByTerminus = new Map<string, NextTrain[]>();

  for (const direction of Object.values(schedule.directions)) {
    for (const trip of direction.trips) {
      const stopIndex = trip.stops.findIndex(s => s.stopId === stopId);
      if (stopIndex === -1) continue;

      // Skip if this is the last stop (terminus) - can't board a terminating train
      if (stopIndex === trip.stops.length - 1) continue;

      const stopTime = trip.stops[stopIndex];
      const depMinutes = timeToMinutes(stopTime.departure);

      // Find when this service next runs (starting from today)
      const nextServiceDay = trip.serviceId
        ? findNextServiceDay(data, trip.serviceId, now)
        : null;

      if (!nextServiceDay) {
        // Service doesn't run within 7 days - skip this train
        continue;
      }

      // Calculate minutes away with smart day handling
      let minutesAway: number;
      let nextDayLabel: string | undefined;

      if (nextServiceDay.daysAway === 0) {
        // Service runs today
        if (depMinutes >= nowMinutes) {
          // Train departs now or in the future today
          minutesAway = depMinutes - nowMinutes;
          nextDayLabel = undefined;
        } else {
          // Train already passed today - find next day this service runs
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const futureServiceDay = findNextServiceDay(data, trip.serviceId!, tomorrow);
          if (!futureServiceDay) {
            // Service doesn't run again within 7 days - skip
            continue;
          }

          // Calculate days from today (add 1 since we searched from tomorrow)
          const daysFromToday = futureServiceDay.daysAway + 1;

          // Calculate minutes: remaining today + full days + departure time
          const remainingToday = MINUTES_IN_DAY - nowMinutes;
          const fullDayMinutes = (daysFromToday - 1) * MINUTES_IN_DAY;
          minutesAway = remainingToday + fullDayMinutes + depMinutes;

          // Set day label
          nextDayLabel = daysFromToday === 1 ? 'Tomorrow' : DAY_NAMES[futureServiceDay.date.getDay()];
        }
      } else {
        // Service runs on a future day (preview for exception services)
        const daysFromToday = nextServiceDay.daysAway;

        // Calculate minutes: remaining today + (daysFromToday - 1) full days + departure time
        const remainingToday = MINUTES_IN_DAY - nowMinutes;
        const fullDayMinutes = (daysFromToday - 1) * MINUTES_IN_DAY;
        minutesAway = remainingToday + fullDayMinutes + depMinutes;

        // Set day label
        nextDayLabel = daysFromToday === 1 ? 'Tomorrow' : DAY_NAMES[nextServiceDay.date.getDay()];
      }

      const terminus = trip.headsign || 'Unknown';
      if (!trainsByTerminus.has(terminus)) {
        trainsByTerminus.set(terminus, []);
      }

      // Check if this train is from an exception-only service
      const isException = trip.serviceId ? isExceptionOnlyService(trip.serviceId, data) : false;
      const exceptionType = isException && trip.serviceId
        ? classifyExceptionServiceType(trip.serviceId)
        : undefined;

      trainsByTerminus.get(terminus)!.push({
        destination: terminus,
        time: stopTime.departure,
        minutesAway,
        nextDayLabel,
        trainNumber: extractTrainNumber(trip.tripId),
        isExceptionService: isException || undefined,
        exceptionServiceType: exceptionType,
      });
    }
  }

  // Convert to array and sort
  const result: DirectionTrains[] = [];
  for (const [terminus, trains] of trainsByTerminus) {
    trains.sort((a, b) => a.minutesAway - b.minutesAway);
    result.push({
      directionName: terminus,
      trains: trains.slice(0, 4) // Show up to 4 trains per terminus
    });
  }

  // Sort directions by next train time
  result.sort((a, b) => a.trains[0].minutesAway - b.trains[0].minutesAway);

  return result;
}
