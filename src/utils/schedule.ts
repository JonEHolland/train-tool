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
 * @param hasTrains - Whether there are any trains for the current route/stop
 */
export function getServiceContext(
  data: ScheduleData,
  route: string,
  hasTrains: boolean
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

  const hasService = routeServiceIds.size > 0 || hasTrains;

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
 * Determines which service IDs are active for today based on calendar rules
 * and date exceptions.
 */
export function getActiveServices(data: ScheduleData): Set<string> {
  const today = new Date();
  // Use local date components, not UTC
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`; // YYYYMMDD in local time
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ...
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

/**
 * Gets trains grouped by direction/terminus for a given route and stop.
 * Calculates minutes away and handles day wrapping for tomorrow's trains.
 */
export function getTrainsByDirection(
  data: ScheduleData,
  route: string,
  stopId: string
): DirectionTrains[] {
  const schedule = data.schedule[route];
  if (!schedule) return [];

  const activeServices = getActiveServices(data);
  const nowMinutes = getCurrentMinutes();

  // Group trains by their terminus (headsign)
  const trainsByTerminus = new Map<string, NextTrain[]>();

  for (const direction of Object.values(schedule.directions)) {
    for (const trip of direction.trips) {
      // Skip trips that aren't running today
      if (trip.serviceId && !activeServices.has(trip.serviceId)) continue;

      const stopIndex = trip.stops.findIndex(s => s.stopId === stopId);
      if (stopIndex === -1) continue;

      // Skip if this is the last stop (terminus) - can't board a terminating train
      if (stopIndex === trip.stops.length - 1) continue;

      const stopTime = trip.stops[stopIndex];
      const depMinutes = timeToMinutes(stopTime.departure);

      // Calculate minutes away, wrapping to next day if train already passed today
      let minutesAway: number;
      let isTomorrow = false;

      if (depMinutes >= nowMinutes) {
        // Train departs now or in the future
        minutesAway = depMinutes - nowMinutes;
      } else {
        // Train already passed today, show tomorrow's departure
        minutesAway = (MINUTES_IN_DAY - nowMinutes) + depMinutes;
        isTomorrow = true;
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
        isTomorrow,
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
