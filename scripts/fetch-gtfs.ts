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
  'EDM': 'S_ED',      // Edmonds
  'EVR': 'S_EV',      // Everett
};
/** Sentinel value for sorting trips without departure times (sorts after all valid times) */
const MAX_TIME_SENTINEL = '99:99:99';

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

  // Get service IDs and their calendars
  const serviceCalendars = new Map<string, Calendar>();
  for (const cal of gtfs['calendar.txt']) {
    serviceCalendars.set(cal.service_id, {
      monday: cal.monday === '1',
      tuesday: cal.tuesday === '1',
      wednesday: cal.wednesday === '1',
      thursday: cal.thursday === '1',
      friday: cal.friday === '1',
      saturday: cal.saturday === '1',
      sunday: cal.sunday === '1',
      start_date: cal.start_date,
      end_date: cal.end_date
    });
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
  const tripStopTimes = new Map<string, GTFSRow[]>();
  for (const st of sounderStopTimes) {
    if (!tripStopTimes.has(st.trip_id)) {
      tripStopTimes.set(st.trip_id, []);
    }
    tripStopTimes.get(st.trip_id)!.push(st);
  }

  // Sort stop times within each trip and build trip schedules
  for (const [tripId, stopTimes] of tripStopTimes) {
    stopTimes.sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));

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

  // Get calendar dates exceptions
  const calendarDates: Record<string, CalendarDate[]> = {};
  if (gtfs['calendar_dates.txt']) {
    for (const cd of gtfs['calendar_dates.txt']) {
      if (!calendarDates[cd.service_id]) {
        calendarDates[cd.service_id] = [];
      }
      calendarDates[cd.service_id].push({
        date: cd.date,
        exception_type: cd.exception_type // 1 = added, 2 = removed
      });
    }
  }

  return {
    schedule,
    calendars: Object.fromEntries(serviceCalendars),
    calendarDates,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Extract train number from Amtrak trip_short_name or trip_id.
 * Amtrak uses numeric train numbers (e.g., "516", "517").
 */
function extractAmtrakTrainNumber(tripShortName: string | undefined, tripId: string): string | undefined {
  // trip_short_name often contains the train number directly
  if (tripShortName && /^\d{3}$/.test(tripShortName)) {
    return tripShortName;
  }
  // Fallback: try to extract from trip_id
  const match = tripId.match(/(\d{3})/);
  return match ? match[1] : undefined;
}

/**
 * Build schedule data for Amtrak RailPlus trains.
 * Only includes trains 516, 517, 518, 519 and stops at SEA, EDM, EVR.
 */
function buildAmtrakScheduleData(gtfs: GTFSFiles): {
  trips: Trip[];
  calendars: Map<string, Calendar>;
  calendarDates: Record<string, CalendarDate[]>;
} {
  console.log('Building Amtrak RailPlus schedule data...');

  // Find Amtrak Cascades route
  const cascadesRoute = gtfs['routes.txt'].find(r =>
    r.route_short_name === 'Cascades' ||
    r.route_long_name?.toLowerCase().includes('cascades')
  );

  if (!cascadesRoute) {
    console.log('  No Amtrak Cascades route found');
    return { trips: [], calendars: new Map(), calendarDates: {} };
  }

  console.log(`  Found Cascades route: ${cascadesRoute.route_id}`);

  // Find trips for Cascades route
  const allTrips = gtfs['trips.txt'].filter(t => t.route_id === cascadesRoute.route_id);
  console.log(`  Found ${allTrips.length} total Cascades trips`);

  // Filter to RailPlus trains only
  const railPlusTrips = allTrips.filter(t => {
    const trainNum = extractAmtrakTrainNumber(t.trip_short_name, t.trip_id);
    return trainNum && RAILPLUS_TRAINS.includes(trainNum);
  });
  console.log(`  Found ${railPlusTrips.length} RailPlus trips (trains ${RAILPLUS_TRAINS.join(', ')})`);

  if (railPlusTrips.length === 0) {
    return { trips: [], calendars: new Map(), calendarDates: {} };
  }

  const tripIds = new Set(railPlusTrips.map(t => t.trip_id));
  const tripMap = new Map(railPlusTrips.map(t => [t.trip_id, t]));

  // Get stop times for RailPlus trips at N-Line stations only
  const amtrakStopCodes = Object.keys(AMTRAK_STATION_MAP);
  const railPlusStopTimes = gtfs['stop_times.txt'].filter(st =>
    tripIds.has(st.trip_id) && amtrakStopCodes.includes(st.stop_id)
  );
  console.log(`  Found ${railPlusStopTimes.length} RailPlus stop times at N-Line stations`);

  // Get stop info (optional, for debugging)
  const stopNames = new Map<string, string>();
  for (const stop of gtfs['stops.txt']) {
    if (amtrakStopCodes.includes(stop.stop_id)) {
      stopNames.set(stop.stop_id, stop.stop_name);
    }
  }

  // Get service calendars for RailPlus trips - WEEKDAY ONLY
  // RailPlus is only available Monday-Friday
  const serviceIds = new Set(railPlusTrips.map(t => t.service_id));
  const serviceCalendars = new Map<string, Calendar>();
  const weekdayServiceIds = new Set<string>();

  for (const cal of gtfs['calendar.txt']) {
    if (serviceIds.has(cal.service_id)) {
      // Only include weekday services (RailPlus doesn't run on weekends)
      const isWeekdayService = cal.monday === '1' || cal.tuesday === '1' ||
        cal.wednesday === '1' || cal.thursday === '1' || cal.friday === '1';
      const isWeekendOnly = cal.saturday === '1' || cal.sunday === '1';

      // Skip weekend-only services
      if (!isWeekdayService && isWeekendOnly) {
        console.log(`  Skipping weekend-only service: ${cal.service_id}`);
        continue;
      }

      weekdayServiceIds.add(cal.service_id);
      serviceCalendars.set(cal.service_id, {
        monday: cal.monday === '1',
        tuesday: cal.tuesday === '1',
        wednesday: cal.wednesday === '1',
        thursday: cal.thursday === '1',
        friday: cal.friday === '1',
        saturday: false, // Force weekday-only for RailPlus
        sunday: false,
        start_date: cal.start_date,
        end_date: cal.end_date
      });
    }
  }

  // Group stop times by trip
  const tripStopTimes = new Map<string, GTFSRow[]>();
  for (const st of railPlusStopTimes) {
    if (!tripStopTimes.has(st.trip_id)) {
      tripStopTimes.set(st.trip_id, []);
    }
    tripStopTimes.get(st.trip_id)!.push(st);
  }

  // Build trips with mapped stop IDs
  const trips: Trip[] = [];
  for (const [tripId, stopTimes] of tripStopTimes) {
    // Need at least 2 stops to be useful (not terminus-only)
    if (stopTimes.length < 2) continue;

    const trip = tripMap.get(tripId)!;

    // Skip trips that don't have weekday service
    if (!weekdayServiceIds.has(trip.service_id)) {
      continue;
    }

    stopTimes.sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));

    const trainNumber = extractAmtrakTrainNumber(trip.trip_short_name, tripId);

    // Determine direction based on stop order within the RailPlus corridor
    // Northbound: SEA -> EDM -> EVR (first stop is SEA)
    // Southbound: EVR -> EDM -> SEA (first stop is EVR)
    const firstStopId = stopTimes[0].stop_id;
    const lastStopId = stopTimes[stopTimes.length - 1].stop_id;

    // Set headsign to the RailPlus corridor terminus (not Vancouver/Portland)
    let headsign: string;
    if (firstStopId === 'SEA' || lastStopId === 'EVR') {
      headsign = 'Everett Station'; // Northbound
    } else {
      headsign = 'King Street Station'; // Southbound
    }

    trips.push({
      tripId: `AMTRAK_${trainNumber}`,
      serviceId: `AMTRAK_${trip.service_id}`,
      headsign,
      provider: 'amtrak',
      stops: stopTimes.map(st => ({
        stopId: AMTRAK_STATION_MAP[st.stop_id],
        name: stopNames.get(st.stop_id) || st.stop_id,
        arrival: st.arrival_time,
        departure: st.departure_time
      }))
    });
  }

  console.log(`  Built ${trips.length} RailPlus trips with N-Line stops`);

  // Get calendar dates exceptions for Amtrak services (weekday only)
  const calendarDates: Record<string, CalendarDate[]> = {};
  if (gtfs['calendar_dates.txt']) {
    for (const cd of gtfs['calendar_dates.txt']) {
      // Only include exceptions for weekday services
      if (weekdayServiceIds.has(cd.service_id)) {
        const amtrakServiceId = `AMTRAK_${cd.service_id}`;
        if (!calendarDates[amtrakServiceId]) {
          calendarDates[amtrakServiceId] = [];
        }
        calendarDates[amtrakServiceId].push({
          date: cd.date,
          exception_type: cd.exception_type
        });
      }
    }
  }

  // Prefix Amtrak service IDs
  const prefixedCalendars = new Map<string, Calendar>();
  for (const [serviceId, cal] of serviceCalendars) {
    prefixedCalendars.set(`AMTRAK_${serviceId}`, cal);
  }

  return { trips, calendars: prefixedCalendars, calendarDates };
}

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

    // Download and process Amtrak GTFS
    try {
      const amtrakBuffer = await downloadGTFS(AMTRAK_GTFS_URL, 'Amtrak');
      const amtrakGtfs = await extractGTFS(amtrakBuffer);
      const amtrakData = buildAmtrakScheduleData(amtrakGtfs);

      // Merge Amtrak RailPlus trains into N-Line
      mergeAmtrakTrips(
        scheduleData,
        amtrakData.trips,
        amtrakData.calendars,
        amtrakData.calendarDates
      );
    } catch (amtrakError) {
      console.warn('\nWarning: Failed to fetch Amtrak data, continuing without it:', amtrakError);
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
