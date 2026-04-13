import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { suggestFinanceCategory } from "@/lib/finance-auto-category"
import { UNCATEGORIZED_VALUE } from "@/lib/finance-categories"

/**
 * Updates uncategorized rows using title/description rules.
 * - ADMIN: all matching rows in the database
 * - User: only their rows
 *
 * Called when opening /finance so you never need to run a manual script.
 */
export async function backfillFinanceAutoCategoriesForSession(
  role: string | undefined,
  userId: string | undefined
): Promise<void> {
  if (process.env.FINANCE_AUTO_BACKFILL === "false") return

  const baseWhere: Prisma.FinanceTransactionWhereInput = {
    OR: [{ category: null }, { category: "" }, { category: UNCATEGORIZED_VALUE }],
  }
  if (role !== "ADMIN" && userId) {
    baseWhere.userId = userId
  }

  const rows = await prisma.financeTransaction.findMany({
    where: baseWhere,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      category: true,
    },
  })

  for (const row of rows) {
    const t = row.type === "INCOME" ? "INCOME" : "EXPENSE"
    const next = suggestFinanceCategory(t, row.title, row.description || "")
    if (!next || next === row.category) continue
    await prisma.financeTransaction.update({
      where: { id: row.id },
      data: { category: next },
    })
  }
}
