import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"
import { ZodError } from "zod"
import { financeBodySchema } from "@/app/api/finance/schema"
import { UNCATEGORIZED_VALUE } from "@/lib/finance-categories"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}
    if (session.user?.role !== "ADMIN") {
      where.userId = session.user!.id
    }
    if (type) {
      where.type = type
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const transactions = await prisma.financeTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching finance transactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = financeBodySchema.parse({
      ...body,
      amount: typeof body.amount === "number" ? body.amount : parseFloat(body.amount),
    })

    if (validatedData.category === UNCATEGORIZED_VALUE) {
      return NextResponse.json(
        {
          error:
            "Choose a specific category for new transactions. “Uncategorized” is not allowed when creating an entry.",
        },
        { status: 400 }
      )
    }

    const transaction = await prisma.financeTransaction.create({
      data: {
        title: validatedData.title,
        type: validatedData.type,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        description: validatedData.description || null,
        receiptUrl: validatedData.receiptUrl || null,
        category: validatedData.category,
        salaryEmployeeName: validatedData.salaryEmployeeName?.trim() || null,
        salaryBankAccount: validatedData.salaryBankAccount?.trim() || null,
        userId: session.user!.id,
      },
    })

    // Log activity
    await createActivityLog({
      actionType: ActionType.CREATE,
      module: Module.FINANCE,
      recordId: transaction.id,
      performedBy: session.user!.id,
      newValues: transaction,
      description: `Created ${validatedData.type.toLowerCase()}: ${validatedData.title}`,
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating finance transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


