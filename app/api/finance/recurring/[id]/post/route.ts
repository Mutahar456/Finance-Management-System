import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"
import { bookingDateForMonth, monthRangeUtc } from "@/lib/recurring-expense-utils"

function canAccessTemplate(session: Session | null | undefined, templateUserId: string) {
  const u = session?.user as { id?: string; role?: string | null } | undefined
  if (!u?.id) return false
  if (u.role === "ADMIN") return true
  return u.id === templateUserId
}

/** POST /api/finance/recurring/[id]/post — book this template for a calendar month (default: current). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const template = await prisma.recurringExpenseTemplate.findUnique({ where: { id: params.id } })
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!(await canAccessTemplate(session, template.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!template.isActive) {
    return NextResponse.json({ error: "Template is inactive" }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const y = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : now.getFullYear()
  const m = searchParams.get("month")
    ? parseInt(searchParams.get("month")!, 10) - 1
    : now.getMonth()
  if (Number.isNaN(y) || Number.isNaN(m) || m < 0 || m > 11) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 })
  }

  const { start, end } = monthRangeUtc(y, m)

  const already = await prisma.financeTransaction.findFirst({
    where: {
      recurringSourceId: template.id,
      date: { gte: start, lte: end },
    },
  })
  if (already) {
    return NextResponse.json(
      {
        error: "Already posted for this month",
        transactionId: already.id,
      },
      { status: 409 }
    )
  }

  const booking = bookingDateForMonth(y, m, template.dayOfMonth)

  const tx = await prisma.financeTransaction.create({
    data: {
      title: template.title,
      type: "EXPENSE",
      amount: template.amount,
      date: booking,
      description:
        template.description ||
        `Monthly recurring expense (template). ${y}-${String(m + 1).padStart(2, "0")}`,
      category: template.category,
      userId: template.userId,
      recurringSourceId: template.id,
    },
  })

  await createActivityLog({
    actionType: ActionType.CREATE,
    module: Module.FINANCE,
    recordId: tx.id,
    performedBy: session.user.id,
    newValues: tx,
    description: `Posted recurring expense: ${template.title}`,
  })

  return NextResponse.json(tx, { status: 201 })
}
