import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FinanceForm } from "@/components/finance/finance-form"
import { ArrowRight, CalendarClock, FileText, Repeat } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AddExpensePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-4">
      <div className="space-y-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Add expense</h1>
        <p className="text-pretty text-sm text-muted-foreground sm:text-base">
          Choose whether to add a <strong className="text-foreground">one-time expense</strong> here, or manage{" "}
          <strong className="text-foreground">recurring monthly bills</strong> using templates.
        </p>
      </div>

      {/* Clear split: one-time vs recurring — reduces confusion */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative rounded-xl border-2 border-primary/45 bg-primary/[0.06] p-4 shadow-sm ring-1 ring-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">On this page</p>
              <h2 className="text-base font-semibold leading-snug">One-time expense</h2>
              <p className="text-pretty text-sm text-muted-foreground">
                For costs that don’t repeat on the same amount or schedule — office supplies, one-off repairs,
                random purchases. Fill in the form below; <strong className="text-foreground">Create transaction</strong>{" "}
                adds a new line in Finance.
              </p>
              <span className="inline-flex rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                Form below — start here
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Repeat className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="text-base font-semibold leading-snug">Monthly bills (templates)</h2>
              <p className="text-pretty text-sm text-muted-foreground">
                For costs that <strong className="text-foreground">repeat every month</strong> — rent, internet,
                software, payroll. Save a <strong className="text-foreground">template</strong> there, then each month
                use <strong className="text-foreground">Post month</strong> to record it in the ledger; budget vs
                actual is tracked too.
              </p>
              <Button asChild variant="secondary" className="mt-1 w-full gap-2 shadow-sm sm:w-auto">
                <Link href="/finance/recurring">
                  <CalendarClock className="h-4 w-4" />
                  Open monthly bills
                  <ArrowRight className="h-4 w-4 opacity-80" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-lg">One-time expense — details</CardTitle>
          <CardDescription>
            A single, one-off charge. If the same bill repeats every month, it’s usually easier to use{" "}
            <Link href="/finance/recurring" className="font-medium text-primary underline-offset-4 hover:underline">
              Monthly bills
            </Link>{" "}
            in the box above.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <FinanceForm defaultType="EXPENSE" />
        </CardContent>
      </Card>
    </div>
  )
}
