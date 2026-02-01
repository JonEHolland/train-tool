/**
 * Extracts the train number from a tripId.
 *
 * Sounder train numbers are typically 4-digit numbers (e.g., "1511", "1700").
 * Amtrak RailPlus train numbers are 3-digit numbers (e.g., "516", "517").
 *
 * They are embedded in tripId with these patterns:
 * - SNDR_Fall2024_Weekday_1700 -> 1700 (extract after last underscore)
 * - SOUNDER_GAMEDAY_1210_Sunday_1811 -> 1811 (extract after last underscore)
 * - 1820E-WSF1200 -> 1820E (extract before hyphen)
 * - 1811-Gameday1310 -> 1811 (extract before hyphen)
 * - AMTRAK_516 -> 516 (extract after AMTRAK_ prefix)
 */
export function extractTrainNumber(tripId: string | undefined): string | undefined {
  if (!tripId) return undefined;

  // Pattern: AMTRAK_* - extract train number after prefix
  if (tripId.startsWith('AMTRAK_')) {
    return tripId.substring(7); // "AMTRAK_".length === 7
  }

  // Pattern: SNDR_* or SOUNDER_* - extract after last underscore
  if (tripId.startsWith('SNDR_') || tripId.startsWith('SOUNDER_')) {
    const lastUnderscore = tripId.lastIndexOf('_');
    if (lastUnderscore !== -1) {
      return tripId.substring(lastUnderscore + 1);
    }
  }

  // Pattern: Number-Something (ferry/gameday) - extract before hyphen
  const hyphenIndex = tripId.indexOf('-');
  if (hyphenIndex !== -1) {
    return tripId.substring(0, hyphenIndex);
  }

  return undefined;
}
