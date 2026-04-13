"use client"

import { useCallback, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Printer, Trash2 } from "lucide-react"
import Link from "next/link"
import { JOINING_LETTER_BG_PATH } from "@/lib/salary-slip-branding"

type Row = { id: string; employeeName: string; amount: string; account: string }

function newRow(): Row {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    employeeName: "",
    amount: "",
    account: "",
  }
}

function formatRsDisplay(raw: string) {
  const n = parseFloat(raw)
  if (Number.isNaN(n)) return "—"
  return `Rs ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const PRINT_STYLE = `
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
  #print-area {
    display: block !important;
    width: 210mm !important;
    min-height: 297mm !important;
    margin: 0 auto !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    background: #ffffff !important;
    position: relative !important;
  }
  .no-break {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  #print-area * {
    box-shadow: none !important;
  }
}
`

export function PayrollLetterClient() {
  const baseId = useId()
  const [reference, setReference] = useState("")
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<Row[]>(() => [newRow(), newRow()])

  const addRow = () => setRows((r) => [...r, newRow()])
  const removeRow = (id: string) => setRows((r) => (r.length <= 1 ? r : r.filter((x) => x.id !== id)))

  const update = (id: string, patch: Partial<Pick<Row, "employeeName" | "amount" | "account">>) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const total = rows.reduce((sum, row) => {
    const n = parseFloat(row.amount)
    return sum + (Number.isNaN(n) ? 0 : n)
  }, 0)

  const print = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="space-y-3 print:space-y-0 md:space-y-6">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />

      <div className="rounded-lg border border-border/60 bg-card/50 p-3 print:hidden sm:p-4">
        <p className="text-xs text-muted-foreground sm:text-sm">
          One row per employee. <strong className="text-foreground">Print</strong> matches this preview.
        </p>
        <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor={`${baseId}-ref`} className="text-xs sm:text-sm">
              Reference (optional)
            </Label>
            <Input
              id={`${baseId}-ref`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. March 2026 batch"
              className="h-9 text-sm sm:h-10"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor={`${baseId}-date`} className="text-xs sm:text-sm">
              Date on letter
            </Label>
            <Input
              id={`${baseId}-date`}
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="h-9 sm:h-10"
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          <Button type="button" variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs sm:h-10 sm:gap-2 sm:text-sm">
            <Link href="/finance">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Finance
            </Link>
          </Button>
          <Button type="button" onClick={addRow} variant="secondary" size="sm" className="h-9 text-xs sm:h-10 sm:text-sm">
            <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add row
          </Button>
          <Button type="button" onClick={print} size="sm" className="col-span-2 h-9 gap-1.5 text-xs sm:col-span-1 sm:h-10 sm:text-sm">
            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Print / PDF
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground sm:mt-3 sm:text-xs">
          Tip: Print → turn off <strong>Headers and footers</strong>.
        </p>
      </div>

      <div
        id="print-area"
        className="payroll-sheet relative mx-auto w-full max-w-[210mm] overflow-hidden bg-white text-foreground print:max-w-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={JOINING_LETTER_BG_PATH}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-fill print:object-fill print:[print-color-adjust:exact]"
        />

        <div className="payroll-letter-overlay relative z-[1] flex min-h-0 flex-col md:min-h-[297mm]">
          <div
            className="no-break flex flex-col gap-2 rounded-sm px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: "#1E293B" }}
          >
            <p className="text-center text-sm font-bold tracking-wide text-white sm:text-left">PAYROLL / TRANSFER LIST</p>
            <p className="text-center text-xs text-white/90 tabular-nums sm:text-right">{payDate}</p>
          </div>

          {reference.trim() ? (
            <p className="mt-3 text-sm font-medium text-[#0f172a]">{reference.trim()}</p>
          ) : null}

          <div className="no-break mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/80">
            <table className="w-full min-w-[280px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1E293B" }}>
                  <th className="px-3 py-2.5 font-semibold text-white">Employee</th>
                  <th className="px-3 py-2.5 text-right font-semibold tabular-nums text-white">Amount (Rs)</th>
                  <th className="px-3 py-2.5 font-semibold text-white">Account no.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 align-top"
                    style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                  >
                    <td className="px-3 py-2">
                      <span className="payroll-print-value font-medium text-[#0f172a]">
                        {row.employeeName.trim() || "—"}
                      </span>
                      <Input
                        className="payroll-screen-input mt-1 h-8 text-xs sm:h-9 sm:text-sm"
                        value={row.employeeName}
                        onChange={(e) => update(row.id, { employeeName: e.target.value })}
                        placeholder="Name"
                      />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="payroll-print-value text-[#0f172a]">{formatRsDisplay(row.amount)}</span>
                      <Input
                        className="payroll-screen-input mt-1 h-8 text-right text-xs sm:h-9 sm:text-sm"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) => update(row.id, { amount: e.target.value })}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <span className="payroll-print-value font-mono text-xs text-[#0f172a] break-all whitespace-pre-wrap">
                            {row.account.trim() || "—"}
                          </span>
                          <Input
                            className="payroll-screen-input mt-1 h-8 font-mono text-xs sm:h-9 sm:text-sm"
                            value={row.account}
                            onChange={(e) => update(row.id, { account: e.target.value })}
                            placeholder="IBAN / account"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 print:hidden"
                          onClick={() => removeRow(row.id)}
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  className="font-semibold"
                  style={{ backgroundColor: "#F97316", color: "#ffffff" }}
                >
                  <td className="px-3 py-2.5">Total</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    Rs{" "}
                    {total.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">Payroll transfer list</p>
        </div>
      </div>
    </div>
  )
}
