/**
 * Direction arrow utilities for train destinations.
 *
 * These functions determine visual direction indicators based on
 * station names and route context.
 */

/** Stations that are northbound destinations on the N-Line */
const N_LINE_NORTHBOUND_STATIONS = ['everett', 'edmonds', 'mukilteo'];

/** Stations that are southbound destinations on both lines */
const SOUTHBOUND_STATIONS = [
  'tacoma',
  'lakewood',
  'puyallup',
  'sumner',
  'auburn',
  'kent',
  'tukwila',
];

/** Stations that vary by route (King Street/Seattle) */
const ROUTE_DEPENDENT_STATIONS = ['seattle', 'king'];

/**
 * Get direction arrow for a train destination.
 *
 * Arrow logic:
 * - N-Line: North = Everett/Edmonds/Mukilteo (↑), South = Seattle/King Street (↓)
 * - S-Line: North = Seattle/King Street (↑), South = Tacoma/Lakewood/etc (↓)
 *
 * @param destinationName - The destination station name (e.g., "Everett Station")
 * @param route - Current route identifier ('n-line' or 's-line')
 * @returns Arrow character ('↑' for north, '↓' for south, '' if unknown)
 */
export function getDirectionArrow(destinationName: string, route?: string): string {
  const name = destinationName.toLowerCase();

  // Northbound destinations on N-Line
  if (N_LINE_NORTHBOUND_STATIONS.some(s => name.includes(s))) {
    return '↑';
  }

  // Southbound destinations (both lines)
  if (SOUTHBOUND_STATIONS.some(s => name.includes(s))) {
    return '↓';
  }

  // King Street/Seattle - direction depends on which line
  if (ROUTE_DEPENDENT_STATIONS.some(s => name.includes(s))) {
    // N-Line: King Street is south of the other stations → going south
    // S-Line: King Street is north of the other stations → going north
    return route === 'n-line' ? '↓' : '↑';
  }

  return '';
}
