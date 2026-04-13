import type { FinanceTransaction } from "@prisma/client"
import fs from "node:fs"
import path from "node:path"
import jsPDF from "jspdf"
import sharp from "sharp"

/** 15mm margins (A4 printable area) in pt */
const MM_TO_PT = 72 / 25.4
const MARGIN_PT = 15 * MM_TO_PT

const COL = {
  orange: [249, 115, 22] as [number, number, number],
  navy: [30, 41, 59] as [number, number, number],
  grey: [100, 116, 139] as [number, number, number],
  greyLight: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  rowAlt: [248, 250, 252] as [number, number, number],
}

type SalaryTx = FinanceTransaction & {
  salaryEmployeeName?: string | null
  salaryBankAccount?: string | null
}

export type SalarySlipExtras = {
  designation?: string
  employeeId?: string
  basicPay?: number
  travelAllowance?: number
}

function parseSalaryExtras(description: string | null | undefined): SalarySlipExtras {
  if (!description?.trim()) return {}
  try {
    const j = JSON.parse(description) as unknown
    if (j && typeof j === "object" && !Array.isArray(j)) return j as SalarySlipExtras
  } catch {
    /* ignore */
  }
  return {}
}

function formatMoney(n: number) {
  return `Rs ${n.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function payPeriodLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" })
}

function paymentDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Optional JSON in `transaction.description`:
 * `{ "designation": "...", "employeeId": "...", "basicPay": 50000, "travelAllowance": 5000 }`
 * If omitted: basicPay = ledger amount, travelAllowance = 0, netPay = amount.
 */
export function buildSalarySlipFields(transaction: SalaryTx) {
  const extras = parseSalaryExtras(transaction.description)
  const ledger = Number(transaction.amount)
  let basicPay = extras.basicPay
  let travelAllowance = extras.travelAllowance
  if (basicPay == null || Number.isNaN(basicPay)) {
    basicPay = ledger
    travelAllowance = travelAllowance ?? 0
  } else {
    travelAllowance = travelAllowance ?? 0
  }
  const netPay = basicPay + travelAllowance

  return {
    name: transaction.salaryEmployeeName?.trim() || transaction.title,
    designation: extras.designation?.trim() || "—",
    employeeId: extras.employeeId?.trim() || "—",
    accountNo: transaction.salaryBankAccount?.trim() || "—",
    basicPay,
    travelAllowance,
    netPay,
    paymentDate: paymentDateLabel(new Date(transaction.date)),
    payPeriod: payPeriodLabel(new Date(transaction.date)),
  }
}

/** Rasterizes `public/Joining Letter.svg` for PDF embedding (matches web letterhead). */
export async function tryLoadLetterheadPngDataUrl(): Promise<string | null> {
  try {
    const svgPath = path.join(process.cwd(), "public", "Joining Letter.svg")
    if (!fs.existsSync(svgPath)) return null
    const png = await sharp(svgPath).png({ compressionLevel: 9 }).toBuffer()
    return `data:image/png;base64,${png.toString("base64")}`
  } catch {
    return null
  }
}

/** Aligns with `SLIP_CONTENT_INSET.paddingTop` (~34%) so slip body sits below fixed artwork. */
const LETTERHEAD_BODY_TOP_RATIO = 0.34

/**
 * Draws a full A4 salary slip (Helvetica, 15mm margins).
 * When `letterheadDataUrl` is set, draws `Joining Letter` full-bleed then the slip body (no duplicate header block).
 */
export function drawSalarySlipOnPdf(
  doc: jsPDF,
  transaction: SalaryTx,
  letterheadDataUrl: string | null,
  generatedBy: string
) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const M = MARGIN_PT
  const innerW = pageW - 2 * M
  let y = M

  const f = buildSalarySlipFields(transaction)

  const useLetterhead = Boolean(letterheadDataUrl)
  if (useLetterhead && letterheadDataUrl) {
    doc.addImage(letterheadDataUrl, "PNG", 0, 0, pageW, pageH)
    y = pageH * LETTERHEAD_BODY_TOP_RATIO
  } else {
    // 1) Top orange bar — 8pt height
    doc.setFillColor(...COL.orange)
    doc.rect(M, y, innerW, 8, "F")
    y += 8 + 10

    // 2) Header
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text("INFINITY WAVE", M, y)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...COL.grey)
    doc.text("Software House", M, y + 14)

    const contact = [
      "Phone: +61 425 221 846  |  Web: infinitywaveinc.com",
      "Email: career@infinitywaveinc.com",
    ]
    doc.setFontSize(8.5)
    doc.text(contact[0], pageW - M, y, { align: "right" })
    doc.text(contact[1], pageW - M, y + 11, { align: "right" })

    y += 32
    doc.setDrawColor(226, 232, 240)
    doc.line(M, y, pageW - M, y)
    y += 18
  }

  // 3) Title bar (navy)
  const titleBarH = 34
  doc.setFillColor(...COL.navy)
  doc.rect(M, y, innerW, titleBarH, "F")
  doc.setTextColor(...COL.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("SALARY SLIP", pageW / 2, y + 22, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(f.payPeriod, pageW - M - 2, y + 14, { align: "right" })
  y += titleBarH + 14

  // 4) Employee info box (height allows multi-line bank account)
  const boxPad = 12
  const acctWPre = innerW / 2 - 78 - boxPad - 4
  const acctLinesPre = doc.splitTextToSize(f.accountNo, acctWPre)
  const acctN = Array.isArray(acctLinesPre) ? acctLinesPre.length : 1
  const boxH = 18 + 22 + 22 + Math.max(24, acctN * 11 + 12) + 22 + boxPad
  doc.setFillColor(...COL.greyLight)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(M, y, innerW, boxH, 4, 4, "FD")
  doc.setTextColor(30, 41, 59)
  const colL = M + boxPad
  const colR = M + innerW / 2 + 8
  const labW = 78
  let ty = y + 18
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COL.grey)
  doc.text("Employee Name:", colL, ty)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(f.name, colL + labW, ty)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COL.grey)
  doc.text("Payment Date:", colR, ty)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(f.paymentDate, colR + labW, ty)
  ty += 22
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COL.grey)
  doc.text("Designation:", colL, ty)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(f.designation, colL + labW, ty)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COL.grey)
  doc.text("Bank Account:", colR, ty)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const acctLines = doc.splitTextToSize(f.accountNo, innerW / 2 - labW - boxPad - 4)
  doc.text(acctLines, colR + labW, ty)
  const acctLineCount = Array.isArray(acctLines) ? acctLines.length : 1
  ty += Math.max(22, acctLineCount * 11 + 10)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COL.grey)
  doc.text("Employee ID:", colL, ty)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(f.employeeId, colL + labW, ty)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COL.grey)
  doc.text("Payment Mode:", colR, ty)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text("Bank Transfer", colR + labW, ty)
  y += boxH + 16

  // 5) Earnings table
  const tableW = innerW
  const colDesc = M + 8
  const colAmt = pageW - M - 8
  const rowH = 22

  doc.setFillColor(...COL.navy)
  doc.rect(M, y, tableW, rowH, "F")
  doc.setTextColor(...COL.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("DESCRIPTION", colDesc, y + 15)
  doc.text("AMOUNT (PKR)", colAmt, y + 15, { align: "right" })
  y += rowH

  const rows: { label: string; amount: number; alt: boolean }[] = [
    { label: "Basic Pay", amount: f.basicPay, alt: false },
    { label: "Travel Allowance", amount: f.travelAllowance, alt: true },
  ]

  rows.forEach((r) => {
    doc.setFillColor(...(r.alt ? COL.rowAlt : COL.white))
    doc.rect(M, y, tableW, rowH, "F")
    doc.setDrawColor(241, 245, 249)
    doc.line(M, y + rowH, M + tableW, y + rowH)
    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(r.label, colDesc + 4, y + 15)
    doc.text(formatMoney(r.amount), colAmt - 4, y + 15, { align: "right" })
    y += rowH
  })

  // Total / net pay
  doc.setFillColor(...COL.orange)
  doc.rect(M, y, tableW, rowH + 2, "F")
  doc.setTextColor(...COL.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("NET PAY", colDesc + 4, y + 16)
  doc.text(formatMoney(f.netPay), colAmt - 4, y + 16, { align: "right" })
  y += rowH + 2 + 20

  // 6) Footer
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...COL.grey)
  doc.text(`Prepared by: ${generatedBy}  ·  HR Department`, M, y)
  doc.text("CEO, Infinity Wave", pageW - M, y, { align: "right" })
  y += 22
  doc.setDrawColor(...COL.orange)
  doc.setLineWidth(0.5)
  doc.line(M, y, pageW - M, y)
  y += 12
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  const genAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  })
  doc.text(
    `Generated on: ${genAt}  |  System generated payslip  |  Infinity Wave Inc.`,
    pageW / 2,
    y,
    { align: "center" }
  )
}
