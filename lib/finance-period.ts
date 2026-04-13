/** Calendar month ranges in local time + month-over-month copy for KPI cards */

export function getCalendarMonthBounds(reference: Date) {
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const thisMonthStart = new Date(y, m, 1, 0, 0, 0, 0)
  const thisMonthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999)
  const prevMonthStart = new Date(y, m - 1, 1, 0, 0, 0, 0)
  const prevMonthEnd = new Date(y, m, 0, 23, 59, 59, 999)
  return { thisMonthStart, thisMonthEnd, prevMonthStart, prevMonthEnd }
}

/**
 * Human-readable MoM change for the same metric (income, expense, or net).
 */
export function formatMonthOverMonthLine(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "Same as last month"
  if (previous === 0) return "No data last month to compare"
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}% vs last month`
}
