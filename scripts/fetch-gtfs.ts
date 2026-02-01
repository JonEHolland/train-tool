import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GTFS_URL = 'https://gtfs.sound.obaweb.org/prod/40_gtfs.zip';
const AMTRAK_GTFS_URL = 'https://content.amtrak.com/content/gtfs/GTFS.zip';
const SOUNDER_ROUTES = ['SNDR_EV', 'SNDR_TL'];
/** RailPlus trains that serve N-Line stations */
const RAILPLUS_TRAINS = ['516', '517', '518', '519'];
/** Map Amtrak station codes to Sounder stop IDs */
const AMTRAK_STATION_MAP: Record<string, string> = {
  'SEA': 'S_KS_T3',  // Seattle King Street
  'EDM': 'S_ED',     // Edmonds
  'EVR': 'S_EV',     // Everett
};
/** Amtrak station names for display */
const AMTRAK_STATION_NAMES: Record<string, string> = {
  'SEA': 'King Street Station',
  'EDM': 'Edmonds Station',
  'EVR': 'Everett Station',
};
/** Hours to subtract to convert Eastern Time to Pacific Time */
const EASTERN_TO_PACIFIC_HOURS = 3;
/** Sentinel value for sorting trips without departure times (sorts after all valid times) */
const MAX_TIME_SENTINEL = '99:99:99';

// =============================================================================
// GTFS Parsing Utilities (shared between Sounder and Amtrak)
// =============================================================================

interface GTFSRow {
  [key: string]: string;
}

interface GTFSFiles {
  [filename: string]: GTFSRow[];
}

interface Stop {
  stopId: string;
  name: string;
}

interface TripStop {
  stopId: string;
  name: string;
  arrival: string;
  departure: string;
}

type TrainProvider = 'sounder' | 'amtrak';

interface Trip {
  tripId: string;
  serviceId: string;
  headsign: string;
  stops: TripStop[];
  provider?: TrainProvider;
}

interface Direction {
  name: string;
  trips: Trip[];
}

interface Route {
  name: string;
  routeId: string;
  directions: Record<string, Direction>;
  stops: Stop[];
}

interface Calendar {
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

interface CalendarDate {
  date: string;
  exception_type: string;
}

interface ScheduleData {
  schedule: Record<string, Route>;
  calendars: Record<string, Calendar>;
  calendarDates: Record<string, CalendarDate[]>;
  generatedAt: string;
}

async function downloadGTFS(url: string, name: string): Promise<ArrayBuffer> {
  console.log(`Downloading ${name} GTFS data...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${name} GTFS: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  console.log(`${name} download complete.`);
  return buffer;
}

function parseCSV(content: string): GTFSRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: GTFSRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: GTFSRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

async function extractGTFS(buffer: ArrayBuffer): Promise<GTFSFiles> {
  console.log('Extracting GTFS files...');
  const zip = await JSZip.loadAsync(buffer);

  const files: GTFSFiles = {};
  const needed = ['routes.txt', 'trips.txt', 'stop_times.txt', 'stops.txt', 'calendar.txt', 'calendar_dates.txt'];

  for (const filename of needed) {
    const file = zip.file(filename);
    if (file) {
      const content = await file.async('string');
      files[filename] = parseCSV(content);
      console.log(`  Parsed ${filename}: ${files[filename].length} rows`);
    }
  }

  return files;
}

/**
 * Parse a GTFS calendar row into our Calendar interface.
 */
function parseCalendar(cal: GTFSRow): Calendar {
  return {
    monday: cal.monday === '1',
    tuesday: cal.tuesday === '1',
    wednesday: cal.wednesday === '1',
    thursday: cal.thursday === '1',
    friday: cal.friday === '1',
    saturday: cal.saturday === '1',
    sunday: cal.sunday === '1',
    start_date: cal.start_date,
    end_date: cal.end_date,
  };
}

/**
 * Check if a calendar represents a weekday-only service.
 */
function isWeekdayOnlyService(cal: GTFSRow): boolean {
  return (
    cal.monday === '1' && cal.tuesday === '1' && cal.wednesday === '1' &&
    cal.thursday === '1' && cal.friday === '1'
  );
}

/**
 * Group stop times by trip ID.
 */
function groupStopTimesByTrip(stopTimes: GTFSRow[]): Map<string, GTFSRow[]> {
  const grouped = new Map<string, GTFSRow[]>();
  for (const st of stopTimes) {
    if (!grouped.has(st.trip_id)) {
      grouped.set(st.trip_id, []);
    }
    grouped.get(st.trip_id)!.push(st);
  }
  return grouped;
}

/**
 * Sort stop times by sequence number (mutates array in place).
 */
function sortStopTimesBySequence(stopTimes: GTFSRow[]): void {
  stopTimes.sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));
}

/**
 * Parse calendar dates exceptions from GTFS.
 * Optionally filter to only include specified service IDs.
 */
function parseCalendarDates(
  gtfs: GTFSFiles,
  serviceIdFilter?: Set<string>
): Record<string, CalendarDate[]> {
  const calendarDates: Record<string, CalendarDate[]> = {};

  if (!gtfs['calendar_dates.txt']) {
    return calendarDates;
  }

  for (const cd of gtfs['calendar_dates.txt']) {
    // Skip if filter provided and service ID not in filter
    if (serviceIdFilter && !serviceIdFilter.has(cd.service_id)) {
      continue;
    }

    if (!calendarDates[cd.service_id]) {
      calendarDates[cd.service_id] = [];
    }
    calendarDates[cd.service_id].push({
      date: cd.date,
      exception_type: cd.exception_type, // 1 = added, 2 = removed
    });
  }

  return calendarDates;
}

/**
 * Convert GTFS time from Eastern Time to Pacific Time.
 * Amtrak GTFS uses Eastern Time for all stops nationwide.
 *
 * GTFS times can exceed 24:00:00 for trips that span midnight.
 */
function convertEasternToPacific(timeStr: string): string {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  let pacificHours = hours - EASTERN_TO_PACIFIC_HOURS;

  if (pacificHours < 0) {
    pacificHours += 24;
  }

  return `${String(pacificHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// =============================================================================
// Sounder Schedule Building
// =============================================================================

function buildScheduleData(gtfs: GTFSFiles): ScheduleData {
  console.log('Building schedule data...');

  // Find Sounder routes
  const sounderRoutes = gtfs['routes.txt'].filter(r =>
    SOUNDER_ROUTES.some(sr => r.route_id.includes(sr))
  );
  console.log(`  Found ${sounderRoutes.length} Sounder routes`);

  const routeIds = new Set(sounderRoutes.map(r => r.route_id));

  // Find trips for Sounder routes
  const sounderTrips = gtfs['trips.txt'].filter(t => routeIds.has(t.route_id));
  console.log(`  Found ${sounderTrips.length} Sounder trips`);

  const tripIds = new Set(sounderTrips.map(t => t.trip_id));
  const tripMap = new Map(sounderTrips.map(t => [t.trip_id, t]));

  // Parse all calendars
  const serviceCalendars = new Map<string, Calendar>();
  for (const cal of gtfs['calendar.txt']) {
    serviceCalendars.set(cal.service_id, parseCalendar(cal));
  }

  // Get stop times for Sounder trips
  const sounderStopTimes = gtfs['stop_times.txt'].filter(st => tripIds.has(st.trip_id));
  console.log(`  Found ${sounderStopTimes.length} Sounder stop times`);

  // Get stop info
  const stopIds = new Set(sounderStopTimes.map(st => st.stop_id));
  const stops = new Map<string, { name: string; lat: number; lon: number }>();
  for (const stop of gtfs['stops.txt']) {
    if (stopIds.has(stop.stop_id)) {
      stops.set(stop.stop_id, {
        name: stop.stop_name,
        lat: parseFloat(stop.stop_lat),
        lon: parseFloat(stop.stop_lon)
      });
    }
  }
  console.log(`  Found ${stops.size} Sounder stops`);

  // Build schedule by route and direction
  const schedule: Record<string, Route> = {};

  for (const route of sounderRoutes) {
    const routeKey = route.route_id.includes('SNDR_EV') ? 'n-line' : 's-line';
    // Use official names from GTFS: route_short_name + route_long_name
    const routeName = `${route.route_short_name} (${route.route_long_name})`;

    schedule[routeKey] = {
      name: routeName,
      routeId: route.route_id,
      directions: {
        '0': { name: '', trips: [] },
        '1': { name: '', trips: [] }
      },
      stops: []
    };
  }

  // Group stop times by trip
  const tripStopTimes = groupStopTimesByTrip(sounderStopTimes);

  // Sort stop times within each trip and build trip schedules
  for (const [tripId, stopTimes] of tripStopTimes) {
    sortStopTimesBySequence(stopTimes);

    const trip = tripMap.get(tripId)!;
    const routeKey = trip.route_id.includes('SNDR_EV') ? 'n-line' : 's-line';
    const direction = trip.direction_id || '0';

    const tripSchedule: Trip = {
      tripId: tripId,
      serviceId: trip.service_id,
      headsign: trip.trip_headsign || '',
      stops: stopTimes.map(st => ({
        stopId: st.stop_id,
        name: stops.get(st.stop_id)?.name || st.stop_id,
        arrival: st.arrival_time,
        departure: st.departure_time
      }))
    };

    schedule[routeKey].directions[direction].trips.push(tripSchedule);
  }

  // Build stop list and direction names from the longest trips (furthest terminus)
  for (const routeKey of Object.keys(schedule)) {
    // Find the longest trip overall (for stop list)
    let longestTripOverall = schedule[routeKey].directions['0'].trips[0];

    // Find the longest trip per direction (for direction names)
    for (const dir of ['0', '1']) {
      let longestInDir = schedule[routeKey].directions[dir].trips[0];
      for (const trip of schedule[routeKey].directions[dir].trips) {
        if (trip.stops.length > (longestInDir?.stops.length || 0)) {
          longestInDir = trip;
        }
        if (trip.stops.length > (longestTripOverall?.stops.length || 0)) {
          longestTripOverall = trip;
        }
      }
      // Set direction name from the furthest terminus
      if (longestInDir?.headsign) {
        schedule[routeKey].directions[dir].name = longestInDir.headsign;
      }
    }

    if (longestTripOverall) {
      schedule[routeKey].stops = longestTripOverall.stops.map(s => ({
        stopId: s.stopId,
        name: s.name
      }));
    }

    // Sort trips by first departure time
    for (const dir of ['0', '1']) {
      schedule[routeKey].directions[dir].trips.sort((a, b) => {
        const timeA = a.stops[0]?.departure || MAX_TIME_SENTINEL;
        const timeB = b.stops[0]?.departure || MAX_TIME_SENTINEL;
        return timeA.localeCompare(timeB);
      });
    }
  }

  return {
    schedule,
    calendars: Object.fromEntries(serviceCalendars),
    calendarDates: parseCalendarDates(gtfs),
    generatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Amtrak RailPlus Schedule Building
// =============================================================================

/**
 * Build RailPlus schedule data from Amtrak GTFS.
 *
 * RailPlus is a Sound Transit/Amtrak agreement allowing ORCA fare payment
 * on specific Amtrak Cascades trains (516, 517, 518, 519) between
 * Seattle, Edmonds, and Everett.
 *
 * Important: Amtrak GTFS uses Eastern Time for all stops. We convert
 * to Pacific Time for Seattle-area stations.
 */
function buildAmtrakScheduleData(gtfs: GTFSFiles): {
  trips: Trip[];
  calendars: Map<string, Calendar>;
  calendarDates: Record<string, CalendarDate[]>;
} {
  console.log('Building RailPlus schedule data from Amtrak GTFS...');

  // Find RailPlus trips (trains 516, 517, 518, 519)
  const railPlusTrips = gtfs['trips.txt'].filter(t =>
    RAILPLUS_TRAINS.includes(t.trip_short_name)
  );
  console.log(`  Found ${railPlusTrips.length} RailPlus trip variants`);

  // Get trip IDs and build trip map
  const tripIds = new Set(railPlusTrips.map(t => t.trip_id));
  const tripMap = new Map(railPlusTrips.map(t => [t.trip_id, t]));

  // Get stop times for RailPlus trips, filtered to RailPlus stations only
  const railPlusStopIds = new Set(Object.keys(AMTRAK_STATION_MAP));
  const railPlusStopTimes = gtfs['stop_times.txt'].filter(st =>
    tripIds.has(st.trip_id) && railPlusStopIds.has(st.stop_id)
  );
  console.log(`  Found ${railPlusStopTimes.length} RailPlus stop times at SEA/EDM/EVR`);

  // Get calendars - filter to weekday-only services for RailPlus
  const calendars = new Map<string, Calendar>();
  const weekdayServiceIds = new Set<string>();

  for (const cal of gtfs['calendar.txt']) {
    if (isWeekdayOnlyService(cal)) {
      weekdayServiceIds.add(cal.service_id);
      calendars.set(cal.service_id, parseCalendar(cal));
    }
  }

  // Group stop times by trip
  const tripStopTimes = groupStopTimesByTrip(railPlusStopTimes);

  // Build trips, filtering to weekday services only
  const trips: Trip[] = [];
  const seenTrains = new Set<string>();

  for (const [tripId, stopTimes] of tripStopTimes) {
    const tripInfo = tripMap.get(tripId)!;

    // Only include weekday services
    if (!weekdayServiceIds.has(tripInfo.service_id)) {
      continue;
    }

    // Only include one trip per train number (avoid duplicates from multiple service calendars)
    const trainNumber = tripInfo.trip_short_name;
    if (seenTrains.has(trainNumber)) {
      continue;
    }
    seenTrains.add(trainNumber);

    // Sort stops by sequence
    sortStopTimesBySequence(stopTimes);

    // Must have all 3 RailPlus stops
    if (stopTimes.length !== 3) {
      console.log(`  Warning: Train ${trainNumber} has ${stopTimes.length} stops instead of 3, skipping`);
      continue;
    }

    // Determine direction based on stop order
    const firstStop = stopTimes[0].stop_id;
    const lastStop = stopTimes[stopTimes.length - 1].stop_id;
    const isNorthbound = firstStop === 'SEA' && lastStop === 'EVR';

    // Set headsign based on terminus
    const headsign = isNorthbound ? 'Everett Station' : 'King Street Station';

    const trip: Trip = {
      tripId: `AMTRAK_${trainNumber}`,
      serviceId: tripInfo.service_id,
      headsign,
      provider: 'amtrak',
      stops: stopTimes.map(st => ({
        stopId: AMTRAK_STATION_MAP[st.stop_id],
        name: AMTRAK_STATION_NAMES[st.stop_id],
        arrival: convertEasternToPacific(st.arrival_time),
        departure: convertEasternToPacific(st.departure_time),
      })),
    };

    trips.push(trip);
  }

  // Sort trips by train number for consistent output
  trips.sort((a, b) => a.tripId.localeCompare(b.tripId));

  console.log(`  Built ${trips.length} RailPlus trips: ${trips.map(t => t.tripId.replace('AMTRAK_', '')).join(', ')}`);

  // Get calendar dates exceptions (only for our weekday services)
  const calendarDates = parseCalendarDates(gtfs, new Set(calendars.keys()));

  return { trips, calendars, calendarDates };
}

// =============================================================================
// Schedule Merging
// =============================================================================

/**
 * Merge Amtrak trips into Sounder schedule data.
 * RailPlus trains are added to N-Line directions based on their headsign.
 */
function mergeAmtrakTrips(
  scheduleData: ScheduleData,
  amtrakTrips: Trip[],
  amtrakCalendars: Map<string, Calendar>,
  amtrakCalendarDates: Record<string, CalendarDate[]>
): void {
  if (amtrakTrips.length === 0) {
    console.log('No Amtrak trips to merge');
    return;
  }

  console.log('\nMerging Amtrak trips into N-Line...');

  // Add Amtrak calendars
  for (const [serviceId, cal] of amtrakCalendars) {
    scheduleData.calendars![serviceId] = cal;
  }

  // Add Amtrak calendar dates
  for (const [serviceId, dates] of Object.entries(amtrakCalendarDates)) {
    scheduleData.calendarDates![serviceId] = dates;
  }

  // Add trips to appropriate N-Line direction based on headsign
  const nLine = scheduleData.schedule['n-line'];
  if (!nLine) {
    console.log('  N-Line not found in schedule');
    return;
  }

  let northboundCount = 0;
  let southboundCount = 0;

  for (const trip of amtrakTrips) {
    // Determine direction based on headsign or first/last stop
    const headsign = trip.headsign.toLowerCase();
    const firstStopId = trip.stops[0]?.stopId;
    const lastStopId = trip.stops[trip.stops.length - 1]?.stopId;

    // Northbound: heading to Everett/Vancouver
    // Southbound: heading to Seattle/Portland
    const isNorthbound =
      headsign.includes('vancouver') ||
      headsign.includes('everett') ||
      lastStopId === 'S_EV' ||
      firstStopId === 'S_KS_T3';

    if (isNorthbound) {
      nLine.directions['0'].trips.push(trip);
      northboundCount++;
    } else {
      nLine.directions['1'].trips.push(trip);
      southboundCount++;
    }
  }

  console.log(`  Added ${northboundCount} northbound Amtrak trips`);
  console.log(`  Added ${southboundCount} southbound Amtrak trips`);

  // Re-sort trips by first departure time
  for (const dir of ['0', '1']) {
    nLine.directions[dir].trips.sort((a, b) => {
      const timeA = a.stops[0]?.departure || MAX_TIME_SENTINEL;
      const timeB = b.stops[0]?.departure || MAX_TIME_SENTINEL;
      return timeA.localeCompare(timeB);
    });
  }
}

async function main(): Promise<void> {
  try {
    // Download and process Sounder GTFS
    const sounderBuffer = await downloadGTFS(GTFS_URL, 'Sound Transit');
    const sounderGtfs = await extractGTFS(sounderBuffer);
    const scheduleData = buildScheduleData(sounderGtfs);

    // Download and process Amtrak GTFS for RailPlus trains
    try {
      const amtrakBuffer = await downloadGTFS(AMTRAK_GTFS_URL, 'Amtrak');
      const amtrakGtfs = await extractGTFS(amtrakBuffer);
      const amtrakData = buildAmtrakScheduleData(amtrakGtfs);

      // Merge RailPlus trains into N-Line
      mergeAmtrakTrips(
        scheduleData,
        amtrakData.trips,
        amtrakData.calendars,
        amtrakData.calendarDates
      );
    } catch (amtrakError) {
      console.warn('\nWarning: Failed to fetch Amtrak data, continuing without RailPlus trains:', amtrakError);
    }

    console.log('\nSchedule summary:');
    for (const [key, route] of Object.entries(scheduleData.schedule)) {
      console.log(`  ${route.name}:`);
      for (const [dir, data] of Object.entries(route.directions)) {
        const sounderTrips = data.trips.filter(t => !t.provider || t.provider === 'sounder');
        const amtrakTrips = data.trips.filter(t => t.provider === 'amtrak');
        console.log(`    Direction ${dir} (${data.name}): ${sounderTrips.length} Sounder + ${amtrakTrips.length} Amtrak trips`);
      }
    }

    const outputPath = path.join(__dirname, '..', 'src', 'schedule-data.json');
    console.log(`\nWriting schedule data to ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify(scheduleData, null, 2));
    console.log('Done!');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
