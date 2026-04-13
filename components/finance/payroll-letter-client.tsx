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
    <div className="space-y-2 print:space-y-0 sm:space-y-3 md:space-y-6">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />

      <div className="rounded-md border border-border/60 bg-card/50 p-2.5 print:hidden sm:rounded-lg sm:p-4">
        <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
          One row per employee. <strong className="text-foreground">Print</strong> matches this preview.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:mt-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor={`${baseId}-ref`} className="text-[11px] sm:text-sm">
              Reference
            </Label>
            <Input
              id={`${baseId}-ref`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional note"
              className="h-8 text-xs sm:h-10 sm:text-sm"
            />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor={`${baseId}-date`} className="text-[11px] sm:text-sm">
              Date
            </Label>
            <Input
              id={`${baseId}-date`}
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="h-8 text-xs sm:h-10"
            />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-3 sm:flex sm:flex-wrap sm:gap-2">
          <Button type="button" variant="outline" size="sm" asChild className="h-8 gap-0.5 px-1.5 text-[10px] sm:h-10 sm:gap-2 sm:px-3 sm:text-sm">
            <Link href="/finance" className="flex min-w-0 items-center justify-center">
              <ArrowLeft className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Finance</span>
            </Link>
          </Button>
          <Button type="button" onClick={addRow} variant="secondary" size="sm" className="h-8 px-1 text-[10px] sm:h-10 sm:px-3 sm:text-sm">
            <Plus className="mr-0.5 h-3 w-3 sm:mr-1 sm:h-4 sm:w-4" />
            Row
          </Button>
          <Button
            type="button"
            onClick={print}
            size="sm"
            className="h-8 gap-0.5 px-1.5 text-[10px] sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">PDF</span>
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] leading-tight text-muted-foreground sm:mt-3 sm:text-xs">
          Print dialog → off <strong>Headers &amp; footers</strong>
        </p>
      </div>

      {/* Wider preview on mobile (cancels page horizontal padding); print unchanged */}
      <div className="-mx-2 w-[calc(100%+1rem)] overflow-x-auto overflow-y-visible print:m-0 print:w-full print:max-w-none print:overflow-visible sm:mx-0 sm:w-full">
        <div
          id="print-area"
          className="payroll-sheet relative mx-auto w-full min-w-0 max-w-[210mm] overflow-hidden bg-white text-foreground print:max-w-none"
        >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={JOINING_LETTER_BG_PATH}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-fill print:object-fill print:[print-color-adjust:exact]"
        />

        <div className="payroll-letter-overlay relative z-[1] flex min-h-0 flex-col md:min-h-[297mm]">
          <div
            className="no-break flex flex-col gap-1 rounded-sm px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-4 sm:py-3"
            style={{ backgroundColor: "#1E293B" }}
          >
            <p className="text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-white sm:text-left sm:text-sm">
              PAYROLL / TRANSFER LIST
            </p>
            <p className="text-center text-[10px] text-white/90 tabular-nums sm:text-right sm:text-xs">{payDate}</p>
          </div>

          {reference.trim() ? (
            <p className="mt-2 text-xs font-medium text-[#0f172a] sm:mt-3 sm:text-sm">{reference.trim()}</p>
          ) : null}

          <div className="no-break mt-2 overflow-x-auto rounded-md border border-slate-200 bg-slate-50/80 sm:mt-4 sm:rounded-lg">
            <table className="w-full min-w-[272px] border-collapse text-left text-[10px] sm:min-w-[280px] sm:text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1E293B" }}>
                  <th className="px-1.5 py-1.5 font-semibold text-white sm:px-3 sm:py-2.5">
                    <span className="inline sm:hidden print:hidden">Name</span>
                    <span className="hidden sm:inline print:inline">Employee</span>
                  </th>
                  <th className="px-1.5 py-1.5 text-right font-semibold tabular-nums text-white sm:px-3 sm:py-2.5">
                    <span className="inline sm:hidden print:hidden">Amt</span>
                    <span className="hidden sm:inline print:inline">Amount (Rs)</span>
                  </th>
                  <th className="px-1.5 py-1.5 font-semibold text-white sm:px-3 sm:py-2.5">
                    <span className="inline sm:hidden print:hidden">Acct</span>
                    <span className="hidden sm:inline print:inline">Account no.</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 align-top"
                    style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                  >
                    <td className="px-1.5 py-1 sm:px-3 sm:py-2">
                      <span className="payroll-print-value font-medium text-[#0f172a]">
                        {row.employeeName.trim() || "—"}
                      </span>
                      <Input
                        className="payroll-screen-input mt-0.5 h-7 text-[10px] sm:mt-1 sm:h-9 sm:text-sm"
                        value={row.employeeName}
                        onChange={(e) => update(row.id, { employeeName: e.target.value })}
                        placeholder="Name"
                      />
                    </td>
                    <td className="px-1.5 py-1 text-right tabular-nums sm:px-3 sm:py-2">
                      <span className="payroll-print-value text-[#0f172a]">{formatRsDisplay(row.amount)}</span>
                      <Input
                        className="payroll-screen-input mt-0.5 h-7 text-right text-[10px] sm:mt-1 sm:h-9 sm:text-sm"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) => update(row.id, { amount: e.target.value })}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-1.5 py-1 sm:px-3 sm:py-2">
                      <div className="flex items-start gap-0.5 sm:gap-1">
                        <div className="min-w-0 flex-1">
                          <span className="payroll-print-value font-mono text-[10px] text-[#0f172a] break-all whitespace-pre-wrap sm:text-xs">
                            {row.account.trim() || "—"}
                          </span>
                          <Input
                            className="payroll-screen-input mt-0.5 h-7 font-mono text-[10px] sm:mt-1 sm:h-9 sm:text-sm"
                            value={row.account}
                            onChange={(e) => update(row.id, { account: e.target.value })}
                            placeholder="IBAN"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 print:hidden sm:h-8 sm:w-8"
                          onClick={() => removeRow(row.id)}
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                  <td className="px-1.5 py-2 text-[10px] sm:px-3 sm:py-2.5 sm:text-sm">Total</td>
                  <td className="px-1.5 py-2 text-right text-[10px] tabular-nums sm:px-3 sm:py-2.5 sm:text-sm">
                    Rs{" "}
                    {total.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-1.5 py-2 sm:px-3 sm:py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-3 text-center text-[10px] text-muted-foreground sm:mt-6 sm:text-xs">Payroll transfer list</p>
        </div>
        </div>
      </div>
    </div>
  )
}
