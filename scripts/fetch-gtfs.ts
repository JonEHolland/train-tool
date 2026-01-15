import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GTFS_URL = 'https://gtfs.sound.obaweb.org/prod/40_gtfs.zip';
const SOUNDER_ROUTES = ['SNDR_EV', 'SNDR_TL'];
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

interface Trip {
  tripId: string;
  serviceId: string;
  headsign: string;
  stops: TripStop[];
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

async function downloadGTFS(): Promise<ArrayBuffer> {
  console.log('Downloading GTFS data...');
  const response = await fetch(GTFS_URL);
  if (!response.ok) {
    throw new Error(`Failed to download GTFS: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  console.log('Download complete.');
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

async function main(): Promise<void> {
  try {
    const buffer = await downloadGTFS();
    const gtfs = await extractGTFS(buffer);
    const scheduleData = buildScheduleData(gtfs);

    console.log('\nSchedule summary:');
    for (const [key, route] of Object.entries(scheduleData.schedule)) {
      console.log(`  ${route.name}:`);
      for (const [dir, data] of Object.entries(route.directions)) {
        console.log(`    Direction ${dir} (${data.name}): ${data.trips.length} trips`);
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
