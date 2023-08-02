export function getXDaysAgoDateUtc(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function getXYearsAgoDateUtc(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function getYesterdayDateUtc() {
  return getXDaysAgoDateUtc(1);
}

export function getTodayDateUtc() {
  return getXDaysAgoDateUtc(0);
}

/**
 * Returns the MM-DD-YYYY formatted date string for the given date.
 *
 * These overrides are present so that if the type of the input date is
 * Date, the return type is string, but if the type of the input date is
 * Date | null, the return type is Date | null
 */
export function getMonthDayYearDateString(date: null): null;
export function getMonthDayYearDateString(date: undefined): null;
export function getMonthDayYearDateString(date: Date): string;
export function getMonthDayYearDateString(date: Date | null): string | null;
export function getMonthDayYearDateString(
  date: Date | null | undefined,
): string | null;
export function getMonthDayYearDateString(
  date: Date | null | undefined,
): string | null {
  if (!date) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}
