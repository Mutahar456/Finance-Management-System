import { PayrollLetterClient } from "@/components/finance/payroll-letter-client"

export const dynamic = "force-dynamic"

export default function PayrollLetterPage() {
  return (
    <div className="mx-auto max-w-[220mm] space-y-4 px-3 py-6 print:m-0 print:max-w-none print:space-y-0 print:p-0">
      <div className="print:hidden">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">Payroll letter (letterhead)</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
          Same branded background as salary slips. Enter employees, amounts, and bank details, then print or
          save as PDF. Extra blank rows stay on the sheet if you leave name/amount empty for manual completion.
        </p>
      </div>
      <PayrollLetterClient />
    </div>
  )
}
