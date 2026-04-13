import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MonthlyBudgetSnapshot } from "@/components/dashboard/monthly-budget-snapshot"
import { budgetUtilizationPercent, effectiveMonthlyBudget } from "@/lib/recurring-budget"
import { monthRangeUtc } from "@/lib/recurring-expense-utils"
import { Package, DollarSign, TrendingUp, FolderKanban, ArrowUpRight } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const role = session.user?.role
  const userId = session.user?.id

  const [totalItems, totalValue, totalIncome, totalExpenses, totalProjects, ongoingProjects, recent] =
    await Promise.all([
      prisma.inventoryItem.count({ where: { userId: role === "ADMIN" ? undefined : userId } }),
      prisma.inventoryItem.aggregate({
        where: { userId: role === "ADMIN" ? undefined : userId },
        _sum: { totalValue: true },
      }),
      prisma.financeTransaction.aggregate({
        where: {
          userId: role === "ADMIN" ? undefined : userId,
          type: "INCOME",
        },
        _sum: { amount: true },
      }),
      prisma.financeTransaction.aggregate({
        where: {
          userId: role === "ADMIN" ? undefined : userId,
          type: "EXPENSE",
        },
        _sum: { amount: true },
      }),
      prisma.project.count({
        where:
          role === "ADMIN"
            ? {}
            : {
                assignments: {
                  some: {
                    userId: userId!,
                  },
                },
              },
      }),
      prisma.project.count({
        where: {
          status: "IN_PROGRESS",
          ...(role !== "ADMIN"
            ? {
                assignments: {
                  some: {
                    userId: userId!,
                  },
                },
              }
            : {}),
        },
      }),
      prisma.activityLog.findMany({
        where: role === "ADMIN" ? {} : { performedBy: userId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
    ])

  const now = new Date()
  const viewY = now.getFullYear()
  const viewM = now.getMonth()
  const { start, end } = monthRangeUtc(viewY, viewM)

  let monthlySnapshot: {
    monthLabel: string
    totalPlanned: number
    totalSpent: number
    remaining: number
    utilizationPct: number
    lines: { id: string; title: string; planned: number; spent: number; utilizationPct: number }[]
    templateCount: number
  } | null = null

  try {
    const recurringTemplates = await prisma.recurringExpenseTemplate.findMany({
      where: role === "ADMIN" ? {} : { userId: userId! },
      orderBy: { title: "asc" },
    })

    const activeIds = recurringTemplates.filter((t) => t.isActive).map((t) => t.id)
    const spentById: Record<string, number> = {}
    if (activeIds.length > 0) {
      const groups = await prisma.financeTransaction.groupBy({
        by: ["recurringSourceId"],
        where: {
          type: "EXPENSE",
          recurringSourceId: { in: activeIds },
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      })
      for (const g of groups) {
        if (g.recurringSourceId) {
          spentById[g.recurringSourceId] = Number(g._sum.amount ?? 0)
        }
      }
    }

    let totalPlanned = 0
    let totalSpent = 0
    const lineCandidates: { id: string; title: string; planned: number; spent: number }[] = []
    for (const t of recurringTemplates) {
      if (!t.isActive) continue
      const planned = effectiveMonthlyBudget(t)
      const spent = spentById[t.id] ?? 0
      totalPlanned += planned
      totalSpent += spent
      lineCandidates.push({ id: t.id, title: t.title, planned, spent })
    }

    const utilizationPct = budgetUtilizationPercent(totalSpent, totalPlanned)
    const lines = lineCandidates
      .map((c) => ({
        ...c,
        utilizationPct: budgetUtilizationPercent(c.spent, c.planned),
      }))
      .sort((a, b) => b.planned - a.planned)
      .slice(0, 5)

    const monthLabel = new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric" }).format(
      new Date(viewY, viewM, 1)
    )

    monthlySnapshot = {
      monthLabel,
      totalPlanned,
      totalSpent,
      remaining: totalPlanned - totalSpent,
      utilizationPct,
      lines,
      templateCount: recurringTemplates.length,
    }
  } catch {
    monthlySnapshot = null
  }

  const inventoryValue = totalValue._sum.totalValue || 0
  const income = totalIncome._sum.amount || 0
  const expenses = totalExpenses._sum.amount || 0
  const balance = Number(income) - Number(expenses)

  const stats = [
    {
      title: "Total Inventory Items",
      value: totalItems.toString(),
      description: "Items in stock",
      icon: Package,
      iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Inventory Value",
      value: `Rs ${Number(inventoryValue).toLocaleString()}`,
      description: "Total asset value",
      icon: DollarSign,
      iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Balance",
      value: `Rs ${balance.toLocaleString()}`,
      description: "Income − expenses (all time)",
      icon: TrendingUp,
      iconBg:
        balance >= 0
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/15 text-red-600 dark:text-red-400",
    },
    {
      title: "Ongoing Projects",
      value: ongoingProjects.toString(),
      description: `${totalProjects} total · in progress`,
      icon: FolderKanban,
      iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8 2xl:max-w-[1800px]">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{session.user?.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="border-border/60 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium leading-snug text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {monthlySnapshot && (
        <MonthlyBudgetSnapshot
          monthLabel={monthlySnapshot.monthLabel}
          totalPlanned={monthlySnapshot.totalPlanned}
          totalSpent={monthlySnapshot.totalSpent}
          remaining={monthlySnapshot.remaining}
          utilizationPct={monthlySnapshot.utilizationPct}
          lines={monthlySnapshot.lines}
          templateCount={monthlySnapshot.templateCount}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>Latest changes across modules</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {recent.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground sm:px-0">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recent.map((log) => (
                  <li
                    key={log.id}
                    className="px-4 py-3 transition-colors first:pt-0 hover:bg-muted/30 sm:px-0"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {log.module} · {log.actionType}
                      </span>
                      <time className="text-xs tabular-nums text-muted-foreground">
                        {new Date(log.timestamp as Date).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      {log.description || "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{log.user?.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Shortcuts to common workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild className="w-full justify-center gap-1 shadow-sm">
                <Link href="/projects/new">
                  New project
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href="/inventory/new">Add inventory</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href="/finance/income">Add income</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href="/finance/expense">Add expense</Link>
              </Button>
            </div>
            <Button asChild variant="secondary" className="w-full shadow-sm">
              <Link href="/finance/recurring">Monthly bills &amp; budget</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/finance">Finance overview</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground">
              <Link href="/logs">View activity logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
