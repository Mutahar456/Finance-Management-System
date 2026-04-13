import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import nextDynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, TrendingUp, TrendingDown, Wallet, CalendarClock, BarChart3, List, ScrollText } from "lucide-react"
import {
  formatMonthOverMonthLine,
  getCalendarMonthBounds,
} from "@/lib/finance-period"
import { backfillFinanceAutoCategoriesForSession } from "@/lib/finance-auto-backfill"

const FinanceCharts = nextDynamic(
  () =>
    import("@/components/finance/finance-charts").then((m) => ({
      default: m.FinanceCharts,
    })),
  {
    loading: () => <ChartsBlockSkeleton />,
    ssr: false,
  }
)

const FinanceTable = nextDynamic(
  () =>
    import("@/components/finance/finance-table").then((m) => ({
      default: m.FinanceTable,
    })),
  {
    loading: () => <TableBlockSkeleton />,
  }
)

function ChartsBlockSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="h-[300px] rounded-xl border border-border/80 bg-muted/25 lg:col-span-2" />
      <div className="h-[300px] rounded-xl border border-border/80 bg-muted/25" />
    </div>
  )
}

function TableBlockSkeleton() {
  return (
    <div className="animate-pulse space-y-3 py-2">
      <div className="h-10 rounded-lg bg-muted/40" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 rounded-md bg-muted/25" />
      ))}
    </div>
  )
}

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const role = session.user?.role
  const userId = session.user?.id

  const userFilter = role === "ADMIN" ? {} : { userId: userId! }
  const { thisMonthStart, thisMonthEnd, prevMonthStart, prevMonthEnd } =
    getCalendarMonthBounds(new Date())

  const [
    ,
    transactions,
    incomeLifetimeAgg,
    expenseLifetimeAgg,
    incomeThisAgg,
    incomePrevAgg,
    expenseThisAgg,
    expensePrevAgg,
  ] = await Promise.all([
    backfillFinanceAutoCategoriesForSession(role, userId),
    prisma.financeTransaction.findMany({
      where: role === "ADMIN" ? {} : { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.financeTransaction.aggregate({
      where: { type: "INCOME", ...userFilter },
      _sum: { amount: true },
    }),
    prisma.financeTransaction.aggregate({
      where: { type: "EXPENSE", ...userFilter },
      _sum: { amount: true },
    }),
    prisma.financeTransaction.aggregate({
      where: {
        type: "INCOME",
        ...userFilter,
        date: { gte: thisMonthStart, lte: thisMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.financeTransaction.aggregate({
      where: {
        type: "INCOME",
        ...userFilter,
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.financeTransaction.aggregate({
      where: {
        type: "EXPENSE",
        ...userFilter,
        date: { gte: thisMonthStart, lte: thisMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.financeTransaction.aggregate({
      where: {
        type: "EXPENSE",
        ...userFilter,
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { amount: true },
    }),
  ])

  const totalIncomeLife = Number(incomeLifetimeAgg._sum.amount || 0)
  const totalExpensesLife = Number(expenseLifetimeAgg._sum.amount || 0)
  const balanceLife = totalIncomeLife - totalExpensesLife

  const incomeThis = Number(incomeThisAgg._sum.amount || 0)
  const incomePrev = Number(incomePrevAgg._sum.amount || 0)
  const expenseThis = Number(expenseThisAgg._sum.amount || 0)
  const expensePrev = Number(expensePrevAgg._sum.amount || 0)
  const netThis = incomeThis - expenseThis
  const netPrev = incomePrev - expensePrev

  const incomeMom = formatMonthOverMonthLine(incomeThis, incomePrev)
  const expenseMom = formatMonthOverMonthLine(expenseThis, expensePrev)
  const netMom = formatMonthOverMonthLine(netThis, netPrev)

  const plainTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-6 2xl:max-w-[1800px]">
      {/* Hero + primary actions */}
      <div className="flex flex-col gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Finance
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            This month at a glance, then charts, then every transaction.{" "}
            <span className="text-foreground/90">One-time entries:</span> Add Income / Add Expense.{" "}
            <span className="text-foreground/90">Recurring bills:</span> Monthly bills.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px] sm:max-w-md">
          <Link href="/finance/income" className="w-full">
            <Button variant="outline" size="lg" className="h-11 w-full gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Add income
            </Button>
          </Link>
          <Link href="/finance/expense" className="w-full">
            <Button size="lg" className="h-11 w-full gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          </Link>
          <Link href="/finance/recurring" className="w-full">
            <Button variant="secondary" size="lg" className="h-11 w-full gap-2 shadow-sm">
              <CalendarClock className="h-4 w-4" />
              Monthly bills &amp; budget
            </Button>
          </Link>
          <Link href="/finance/payroll-letter" className="w-full">
            <Button variant="outline" size="lg" className="h-11 w-full gap-2 shadow-sm">
              <ScrollText className="h-4 w-4" />
              Payroll letter (letterhead)
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Income (this month)
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" strokeWidth={2.25} />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-500">
              Rs {incomeThis.toLocaleString()}
            </div>
            <p className="text-xs font-medium text-muted-foreground">{incomeMom}</p>
            <p className="text-xs text-muted-foreground/90">
              All-time: Rs {totalIncomeLife.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expenses (this month)
            </CardTitle>
            <div className="rounded-lg bg-red-500/10 p-2">
              <TrendingDown className="h-4 w-4 text-red-500" strokeWidth={2.25} />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-red-600 dark:text-red-500">
              Rs {expenseThis.toLocaleString()}
            </div>
            <p className="text-xs font-medium text-muted-foreground">{expenseMom}</p>
            <p className="text-xs text-muted-foreground/90">
              All-time: Rs {totalExpensesLife.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net (this month)</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Wallet className="h-4 w-4 text-blue-500" strokeWidth={2.25} />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div
              className={`text-2xl font-semibold tabular-nums tracking-tight ${
                netThis >= 0
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-red-600 dark:text-red-500"
              }`}
            >
              Rs {netThis.toLocaleString()}
            </div>
            <p className="text-xs font-medium text-muted-foreground">{netMom}</p>
            <p className="text-xs text-muted-foreground/90">
              All-time net: Rs {balanceLife.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <section className="space-y-4" aria-labelledby="finance-charts-heading">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-2">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 id="finance-charts-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
                Charts
              </h2>
              <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
                Green bars = income, orange = expenses by month. Blue area = net cash movement over the last
                30 days (filtered list below does not change these charts).
              </p>
            </div>
          </div>
        </div>
        <FinanceCharts transactions={plainTransactions as any} />
      </section>

      {/* Transactions */}
      <section className="space-y-4" aria-labelledby="finance-tx-heading">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-2">
            <List className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 id="finance-tx-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
                All transactions
              </h2>
              <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
                Filter by type, category, or date range. Running balance is computed in date order for the
                filtered rows. Use the pencil to edit or trash to delete.
              </p>
            </div>
          </div>
        </div>
        <Card className="border-border/80 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
            <CardTitle className="text-base font-semibold sm:text-lg">Ledger</CardTitle>
            <CardDescription className="text-sm">
              Scroll horizontally on smaller screens if columns don&apos;t fit. Swipe or use the scrollbar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-5 sm:p-6">
            <FinanceTable transactions={plainTransactions as any} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
