import { PayrollLetterClient } from "@/components/finance/payroll-letter-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function PayrollLetterPage() {
  return (
    <div className="mx-auto max-w-[220mm] space-y-2 px-2 pb-4 pt-1 print:m-0 print:max-w-none print:space-y-0 print:p-0 sm:space-y-4 sm:px-3 sm:pb-6 sm:pt-2 sm:py-6">
      <div className="print:hidden">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild className="h-7 gap-1 px-2 text-[11px] sm:h-9 sm:gap-2 sm:px-3 sm:text-sm">
            <Link href="/finance">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              Back
            </Link>
          </Button>
        </div>
        <h1 className="mt-2 text-balance text-lg font-semibold leading-tight tracking-tight sm:mt-4 sm:text-2xl">
          Payroll letter
        </h1>
        <p className="mt-1 max-w-2xl text-pretty text-[11px] leading-snug text-muted-foreground sm:mt-2 sm:text-sm">
          <span className="sm:hidden">Letterhead preview below — print for full A4.</span>
          <span className="hidden sm:inline">
            Same <strong>Joining Letter</strong> as salary slips. Enter rows, then print or save as PDF. Blank
            rows stay for handwriting.
          </span>
        </p>
      </div>
      <PayrollLetterClient />
    </div>
  )
}
