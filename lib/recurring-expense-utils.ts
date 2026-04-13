/** Book on this calendar day each month (clamp to last day of month). */
export function bookingDateForMonth(year: number, monthIndex0: number, dayOfMonth: number): Date {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate()
  const day = Math.min(Math.max(1, dayOfMonth), lastDay)
  return new Date(year, monthIndex0, day, 12, 0, 0, 0)
}

export function monthRangeUtc(year: number, monthIndex0: number) {
  const start = new Date(year, monthIndex0, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999)
  return { start, end }
}
