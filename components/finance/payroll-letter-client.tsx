"use client"

import { useCallback, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JOINING_LETTER_BG_PATH } from "@/lib/salary-slip-branding"
import { Plus, Printer, Trash2 } from "lucide-react"

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
    <div className="space-y-6 print:space-y-0">
      <div className="rounded-lg border border-border/60 bg-card/50 p-4 print:hidden">
        <p className="text-sm text-muted-foreground">
          Add one row per employee. The same letterhead as salary slips is used; the table sits in the content
          area. Use <strong>Print / Save as PDF</strong> when ready — blank rows print too so you can fill by
          hand if needed.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-ref`}>Reference / note (optional)</Label>
            <Input
              id={`${baseId}-ref`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. March 2026 payroll batch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-date`}>Date on letter</Label>
            <Input
              id={`${baseId}-date`}
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={addRow} variant="secondary" className="gap-2">
            <Plus className="h-4 w-4" />
            Add row
          </Button>
          <Button type="button" onClick={print} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          PDF tip: In the print dialog, open <strong>More settings</strong> and <strong>uncheck Headers and footers</strong> so the browser does not add the page title, URL, or date.
        </p>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <div
          className="payroll-letter-root relative mx-auto w-[210mm] min-h-[297mm] bg-white text-foreground shadow-xl print:mx-0 print:min-h-0 print:shadow-none print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={JOINING_LETTER_BG_PATH}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
          />
          <div
            className="relative z-[1] flex min-h-[297mm] flex-col print:min-h-0 print:h-full"
            style={{
              paddingTop: "30%",
              paddingLeft: "7%",
              paddingRight: "7%",
              paddingBottom: "6%",
            }}
          >
            <div className="max-h-[62%] overflow-y-auto rounded-lg border border-border/40 bg-white/92 px-3 py-3 shadow-sm print:max-h-none print:overflow-visible print:bg-white/95 print:break-inside-avoid sm:px-4 sm:py-4">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/50 pb-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Payroll / transfer list
                  </p>
                  {reference.trim() ? (
                    <p className="mt-0.5 text-sm font-medium">{reference.trim()}</p>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">{payDate}</p>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[280px] border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="py-1.5 pr-2 font-semibold">Employee</th>
                      <th className="py-1.5 pr-2 text-right font-semibold tabular-nums">Amount (Rs)</th>
                      <th className="py-1.5 font-semibold">Account no.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/30 align-top">
                        <td className="py-2 pr-2 print:table-cell print:py-1.5">
                          <span className="payroll-print-value font-medium">
                            {row.employeeName.trim() || "—"}
                          </span>
                          <Input
                            className="payroll-screen-input h-8 text-xs sm:h-9 sm:text-sm"
                            value={row.employeeName}
                            onChange={(e) => update(row.id, { employeeName: e.target.value })}
                            placeholder="Name"
                          />
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums print:table-cell print:py-1.5">
                          <span className="payroll-print-value">{formatRsDisplay(row.amount)}</span>
                          <Input
                            className="payroll-screen-input h-8 text-right text-xs sm:h-9 sm:text-sm"
                            inputMode="decimal"
                            value={row.amount}
                            onChange={(e) => update(row.id, { amount: e.target.value })}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 print:table-cell print:py-1.5">
                          <div className="flex items-start gap-1 print:block">
                            <div className="min-w-0 flex-1 print:w-full">
                              <span className="payroll-print-value max-w-full break-all font-mono text-xs whitespace-pre-wrap">
                                {row.account.trim() || "—"}
                              </span>
                              <Input
                                className="payroll-screen-input h-8 font-mono text-xs sm:h-9 sm:text-sm"
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
                    <tr className="border-t border-border/60 font-semibold">
                      <td className="py-2 text-muted-foreground">Total</td>
                      <td className="py-2 text-right tabular-nums">
                        Rs{" "}
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
