import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"
import { bookingDateForMonth, monthRangeUtc } from "@/lib/recurring-expense-utils"
import { z } from "zod"

const bodySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role
  const userId = session.user.id

  const raw = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(raw)
  const now = new Date()
  const year = parsed.success ? parsed.data.year : now.getFullYear()
  const month1 = parsed.success ? parsed.data.month : now.getMonth() + 1

  const m0 = month1 - 1
  const { start, end } = monthRangeUtc(year, m0)

  const templates = await prisma.recurringExpenseTemplate.findMany({
    where: {
      isActive: true,
      ...(role === "ADMIN" ? {} : { userId }),
    },
  })

  const created: string[] = []
  const skipped: string[] = []
  const errors: { id: string; message: string }[] = []

  for (const template of templates) {
    try {
      const already = await prisma.financeTransaction.findFirst({
        where: {
          recurringSourceId: template.id,
          date: { gte: start, lte: end },
        },
      })
      if (already) {
        skipped.push(template.id)
        continue
      }

      const booking = bookingDateForMonth(year, m0, template.dayOfMonth)
      const tx = await prisma.financeTransaction.create({
        data: {
          title: template.title,
          type: "EXPENSE",
          amount: template.amount,
          date: booking,
          description:
            template.description ||
            `Monthly recurring expense (template). ${year}-${String(month1).padStart(2, "0")}`,
          category: template.category,
          userId: template.userId,
          recurringSourceId: template.id,
        },
      })
      created.push(tx.id)
      await createActivityLog({
        actionType: ActionType.CREATE,
        module: Module.FINANCE,
        recordId: tx.id,
        performedBy: session.user.id,
        newValues: tx,
        description: `Posted recurring expense: ${template.title}`,
      })
    } catch (e: any) {
      errors.push({ id: template.id, message: e?.message ?? "error" })
    }
  }

  return NextResponse.json({
    createdCount: created.length,
    skippedCount: skipped.length,
    errorCount: errors.length,
    createdIds: created,
    errors,
  })
}
