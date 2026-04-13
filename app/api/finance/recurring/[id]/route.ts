import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAllowedCategory } from "@/lib/finance-categories"
import { isStaleClientMissingMonthlyBudget, STALE_PRISMA_CLIENT_HINT } from "@/lib/prisma-stale-budget-field"
import { ZodError, z } from "zod"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  monthlyBudgetAmount: z.number().positive().nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  isActive: z.boolean().optional(),
})

function canAccessTemplate(session: Session | null | undefined, templateUserId: string) {
  const u = session?.user as { id?: string; role?: string | null } | undefined
  if (!u?.id) return false
  if (u.role === "ADMIN") return true
  return u.id === templateUserId
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.recurringExpenseTemplate.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!(await canAccessTemplate(session, existing.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    if (data.category !== undefined && !isAllowedCategory("EXPENSE", data.category)) {
      return NextResponse.json({ error: "Invalid expense category" }, { status: 400 })
    }

    const patch = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.monthlyBudgetAmount !== undefined && {
        monthlyBudgetAmount: data.monthlyBudgetAmount,
      }),
      ...(data.dayOfMonth !== undefined && { dayOfMonth: data.dayOfMonth }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    }

    let row
    try {
      row = await prisma.recurringExpenseTemplate.update({
        where: { id: params.id },
        data: patch,
      })
    } catch (e) {
      if (!isStaleClientMissingMonthlyBudget(e)) throw e
      console.warn(STALE_PRISMA_CLIENT_HINT)
      const { monthlyBudgetAmount: _b, ...patchWithoutBudget } = patch as {
        monthlyBudgetAmount?: unknown
        [key: string]: unknown
      }
      void _b
      if (Object.keys(patchWithoutBudget).length === 0) {
        return NextResponse.json(
          {
            error:
              "Budget cannot be saved until Prisma Client is regenerated. " + STALE_PRISMA_CLIENT_HINT,
          },
          { status: 503 }
        )
      }
      row = await prisma.recurringExpenseTemplate.update({
        where: { id: params.id },
        data: patchWithoutBudget,
      })
    }
    return NextResponse.json(row)
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Invalid data" }, { status: 400 })
    }
    throw e
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.recurringExpenseTemplate.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!(await canAccessTemplate(session, existing.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.recurringExpenseTemplate.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
