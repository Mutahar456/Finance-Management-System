import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { RecurringTemplatesManager } from "@/components/finance/recurring-templates-manager"
import { monthRangeUtc } from "@/lib/recurring-expense-utils"
import { effectiveMonthlyBudget } from "@/lib/recurring-budget"

export const dynamic = "force-dynamic"

function parseViewMonth(searchParams: { y?: string; m?: string }) {
  const now = new Date()
  const y = searchParams.y ? parseInt(searchParams.y, 10) : now.getFullYear()
  const m = searchParams.m ? parseInt(searchParams.m, 10) : now.getMonth() + 1
  if (Number.isNaN(y) || y < 2000 || y > 2100) return { year: now.getFullYear(), month: now.getMonth() + 1 }
  if (Number.isNaN(m) || m < 1 || m > 12) return { year: now.getFullYear(), month: now.getMonth() + 1 }
  return { year: y, month: m }
}

export default async function MonthlyExpensesPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const role = session.user.role
  const userId = session.user.id

  const { year: viewYear, month: viewMonth } = parseViewMonth(searchParams)
  const monthIndex0 = viewMonth - 1
  const { start, end } = monthRangeUtc(viewYear, monthIndex0)

  const templates = await prisma.recurringExpenseTemplate.findMany({
    where: role === "ADMIN" ? {} : { userId },
    orderBy: { title: "asc" },
  })

  const ids = templates.map((t) => t.id)
  let spentByTemplateId: Record<string, number> = {}
  /** Finance row IDs linked to this template for the viewed month (for undo / remove posting). */
  const postedFinanceTxIdsByTemplateId: Record<string, string[]> = {}
  if (ids.length > 0) {
    const groups = await prisma.financeTransaction.groupBy({
      by: ["recurringSourceId"],
      where: {
        type: "EXPENSE",
        recurringSourceId: { in: ids },
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    })
    spentByTemplateId = {}
    for (const g of groups) {
      if (g.recurringSourceId) {
        spentByTemplateId[g.recurringSourceId] = Number(g._sum.amount ?? 0)
      }
    }

    const postedRows = await prisma.financeTransaction.findMany({
      where: {
        type: "EXPENSE",
        recurringSourceId: { in: ids },
        date: { gte: start, lte: end },
      },
      select: { id: true, recurringSourceId: true },
    })
    for (const row of postedRows) {
      if (!row.recurringSourceId) continue
      if (!postedFinanceTxIdsByTemplateId[row.recurringSourceId]) {
        postedFinanceTxIdsByTemplateId[row.recurringSourceId] = []
      }
      postedFinanceTxIdsByTemplateId[row.recurringSourceId].push(row.id)
    }
  }

  let totalPlanned = 0
  let totalSpent = 0
  for (const t of templates) {
    if (!t.isActive) continue
    const planned = effectiveMonthlyBudget(t)
    const spent = spentByTemplateId[t.id] ?? 0
    totalPlanned += planned
    totalSpent += spent
  }

  const plain = templates.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    amount: Number(t.amount),
    monthlyBudgetAmount: t.monthlyBudgetAmount != null ? Number(t.monthlyBudgetAmount) : null,
    dayOfMonth: t.dayOfMonth,
    isActive: t.isActive,
    userId: t.userId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-7xl 2xl:max-w-[1800px] px-1">
      <RecurringTemplatesManager
        initialTemplates={plain}
        viewYear={viewYear}
        viewMonth={viewMonth}
        spentByTemplateId={spentByTemplateId}
        postedFinanceTxIdsByTemplateId={postedFinanceTxIdsByTemplateId}
        budgetSummary={{
          totalPlanned,
          totalSpent,
          remaining: totalPlanned - totalSpent,
        }}
      />
    </div>
  )
}
