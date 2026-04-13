import { PayrollLetterClient } from "@/components/finance/payroll-letter-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function PayrollLetterPage() {
  return (
    <div className="mx-auto max-w-[220mm] space-y-3 px-2 py-4 print:m-0 print:max-w-none print:space-y-0 print:p-0 sm:space-y-4 sm:px-3 sm:py-6">
      <div className="print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild className="h-8 gap-1.5 px-2.5 text-xs sm:h-9 sm:gap-2 sm:px-3 sm:text-sm">
            <Link href="/finance">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back
            </Link>
          </Button>
        </div>
        <h1 className="mt-2 text-balance text-lg font-semibold tracking-tight sm:mt-4 sm:text-2xl">
          Payroll letter
        </h1>
        <p className="mt-1 max-w-2xl text-pretty text-xs text-muted-foreground sm:mt-2 sm:text-sm">
          <span className="sm:hidden">Joining Letter artwork · fill rows · Print for PDF.</span>
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
