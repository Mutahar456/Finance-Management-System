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
