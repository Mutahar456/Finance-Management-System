import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CalendarClock, HelpCircle, PiggyBank } from "lucide-react"

export type MonthlyBudgetLine = {
  id: string
  title: string
  planned: number
  spent: number
  utilizationPct: number
}

export function MonthlyBudgetSnapshot({
  monthLabel,
  totalPlanned,
  totalSpent,
  remaining,
  utilizationPct,
  lines,
  templateCount,
}: {
  monthLabel: string
  totalPlanned: number
  totalSpent: number
  remaining: number
  utilizationPct: number
  lines: MonthlyBudgetLine[]
  templateCount: number
}) {
  const overBudget = remaining < 0
  const barPct = Math.min(100, utilizationPct)

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 bg-muted/20 px-3 pb-3 pt-3 sm:space-y-3 sm:px-6 sm:pb-4 sm:pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 text-primary sm:gap-2">
              <CalendarClock className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Monthly bills</span>
            </div>
            <CardTitle className="text-base font-semibold leading-snug tracking-tight sm:text-lg sm:leading-none md:text-xl">
              Budget vs executed · {monthLabel}
            </CardTitle>
            <CardDescription className="hidden text-pretty text-sm leading-relaxed sm:block">
              <strong>Budget</strong> = planned amount per template (optional override or bill amount).{" "}
              <strong>Executed</strong> = money already posted to Finance this month for that template.
              Compare the two to see utilization.
            </CardDescription>
            <p className="text-xs leading-snug text-muted-foreground sm:hidden">
              <strong>Budget</strong> vs <strong>executed</strong> this month — tap below for details.
            </p>
            <details className="rounded-lg border border-border/50 bg-background/50 text-xs sm:text-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 font-medium text-muted-foreground sm:px-3 sm:py-2.5 [&::-webkit-details-marker]:hidden">
                <HelpCircle className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                How to manage this
              </summary>
              <div className="space-y-2 border-t border-border/40 px-2.5 pb-2.5 pt-2 text-muted-foreground sm:px-3 sm:pb-3">
                <p>
                  1) Add templates under <strong>Monthly bills</strong>. 2) Set optional{" "}
                  <strong>monthly budget</strong> per line or use the bill amount as the plan. 3){" "}
                  <strong>Post month</strong> when you pay — that amount becomes <strong>executed</strong>. 4)
                  Use the bar to see if you are over or under plan.
                </p>
              </div>
            </details>
          </div>
          <Button asChild size="sm" className="h-9 w-full shrink-0 gap-1.5 text-xs shadow-sm sm:h-9 sm:w-auto sm:gap-2 sm:text-sm">
            <Link href="/finance/recurring">
              Manage templates
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-3 pb-4 pt-4 sm:space-y-6 sm:px-6 sm:pb-6 sm:pt-6">
        {templateCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-8 text-center sm:gap-3 sm:px-4 sm:py-12">
            <PiggyBank className="h-8 w-8 text-muted-foreground/70 sm:h-10 sm:w-10" />
            <div>
              <p className="text-sm font-medium sm:text-base">No monthly expense templates yet</p>
              <p className="mt-1 max-w-md text-pretty text-xs text-muted-foreground sm:text-sm">
                Add rent, subscriptions, salaries, and other bills that repeat every month — then track
                budget vs actual here.
              </p>
            </div>
            <Button asChild size="sm" className="mt-1 w-full max-w-xs sm:w-auto">
              <Link href="/finance/recurring">Set up monthly bills</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-3">
              <div className="rounded-lg border border-border/60 bg-background/80 px-2 py-2 shadow-sm sm:rounded-xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Allocated</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums leading-tight sm:mt-1 sm:text-base md:text-lg">
                  Rs {totalPlanned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 px-2 py-2 shadow-sm sm:rounded-xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Executed</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums leading-tight text-foreground sm:mt-1 sm:text-base md:text-lg">
                  Rs {totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 px-2 py-2 shadow-sm sm:rounded-xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Remaining</p>
                <p
                  className={`mt-0.5 text-sm font-semibold tabular-nums leading-tight sm:mt-1 sm:text-base md:text-lg ${
                    overBudget ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  Rs {remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Overall utilization</span>
                <span className="shrink-0 font-medium tabular-nums text-foreground">{utilizationPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    utilizationPct > 100 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>

            {lines.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <p className="text-xs font-medium text-foreground sm:text-sm">Top items</p>
                <ul className="space-y-1.5 sm:space-y-2">
                  {lines.map((line) => (
                    <li
                      key={line.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/15 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-3 sm:py-2.5"
                    >
                      <span className="text-sm font-medium leading-tight">{line.title}</span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 sm:text-sm">
                        <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">
                          Rs {line.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / Rs{" "}
                          {line.planned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-muted sm:max-w-[6rem] sm:w-24 sm:flex-none">
                            <div
                              className={`h-full rounded-full ${
                                line.utilizationPct > 100 ? "bg-destructive" : "bg-primary/80"
                              }`}
                              style={{ width: `${Math.min(100, line.utilizationPct)}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-foreground sm:text-sm">
                            {line.utilizationPct}%
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
