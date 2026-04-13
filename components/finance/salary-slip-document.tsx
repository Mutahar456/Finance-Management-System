import { format } from "date-fns"
import { JOINING_LETTER_BG_PATH, SLIP_CONTENT_INSET } from "@/lib/salary-slip-branding"

export type SalarySlipDocumentProps = {
  employeeName: string | null
  bankAccount: string | null
  amount: number
  title: string
  payDate: Date
  description?: string | null
}

function formatRs(n: number) {
  return `Rs ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function SalarySlipDocument({
  employeeName,
  bankAccount,
  amount,
  title,
  payDate,
  description,
}: SalarySlipDocumentProps) {
  const displayName = employeeName?.trim() || title

  return (
    <div
      className="salary-slip-root relative mx-auto bg-white text-foreground shadow-xl print:mx-0 print:shadow-none print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
      style={{ width: "210mm", minHeight: "297mm" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={JOINING_LETTER_BG_PATH}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-fill print:object-fill"
      />
      <div
        className="relative z-[1] flex min-h-[297mm] flex-col"
        style={SLIP_CONTENT_INSET}
      >
        <div className="rounded-lg border border-border/40 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-[1px] print:border-border/60 print:bg-white/95">
          <p className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Salary slip
          </p>
          <h2 className="mt-1 text-balance text-xl font-semibold tracking-tight">{displayName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment date: {format(payDate, "MMMM d, yyyy")}
          </p>
          <dl className="mt-4 space-y-2 border-t border-border/50 pt-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-semibold tabular-nums text-foreground">{formatRs(amount)}</dd>
            </div>
            {bankAccount?.trim() ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Account no.</dt>
                <dd className="max-w-[65%] text-right font-mono text-xs tabular-nums">
                  {bankAccount.trim()}
                </dd>
              </div>
            ) : null}
            {description?.trim() ? (
              <div className="border-t border-border/40 pt-2">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{description.trim()}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  )
}
