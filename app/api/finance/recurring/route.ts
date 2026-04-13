import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAllowedCategory } from "@/lib/finance-categories"
import { isStaleClientMissingMonthlyBudget, STALE_PRISMA_CLIENT_HINT } from "@/lib/prisma-stale-budget-field"
import { ZodError, z } from "zod"

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  amount: z.number().positive(),
  /** Optional; if omitted, planned budget defaults to `amount` in UI. */
  monthlyBudgetAmount: z.number().positive().optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(28),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role
  const userId = session.user.id

  const list = await prisma.recurringExpenseTemplate.findMany({
    where: role === "ADMIN" ? {} : { userId },
    orderBy: { title: "asc" },
  })

  return NextResponse.json(list)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createSchema.parse({
      ...body,
      amount: typeof body.amount === "number" ? body.amount : parseFloat(body.amount),
    })

    if (!isAllowedCategory("EXPENSE", data.category)) {
      return NextResponse.json({ error: "Invalid expense category" }, { status: 400 })
    }

    const fullData = {
      title: data.title,
      description: data.description || null,
      category: data.category,
      amount: data.amount,
      monthlyBudgetAmount:
        data.monthlyBudgetAmount != null ? data.monthlyBudgetAmount : null,
      dayOfMonth: data.dayOfMonth,
      isActive: data.isActive ?? true,
      userId: session.user.id,
    }

    let row
    try {
      row = await prisma.recurringExpenseTemplate.create({ data: fullData })
    } catch (e) {
      if (!isStaleClientMissingMonthlyBudget(e)) throw e
      console.warn(STALE_PRISMA_CLIENT_HINT)
      const { monthlyBudgetAmount: _b, ...rest } = fullData
      void _b
      row = await prisma.recurringExpenseTemplate.create({ data: rest })
    }

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Invalid data" }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
