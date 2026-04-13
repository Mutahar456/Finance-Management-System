/** Public asset used as full-page background for salary slip & payroll letter print views. */
export const JOINING_LETTER_BG_PATH = "/Joining%20Letter.svg"

/**
 * Content inset as % of page — tune if text overlaps fixed artwork in the SVG.
 * The source file is a full A4 graphic; data sits in a semi-opaque card on top.
 */
export const SLIP_CONTENT_INSET = {
  paddingTop: "34%",
  paddingLeft: "8%",
  paddingRight: "8%",
  paddingBottom: "10%",
} as const

/**
 * Payroll letter padding is defined in `app/globals.css` (`.payroll-letter-overlay` + print rules)
 * so screen / mobile / print can differ. Kept name for search; use CSS classes in UI.
 */
export const PAYROLL_LETTER_CONTENT_INSET = {
  paddingTop: "26%",
  paddingLeft: "8%",
  paddingRight: "8%",
  paddingBottom: "6%",
} as const
