import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"
import { z } from "zod"

const financeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Amount must be positive"),
  date: z.string(),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingTransaction = await prisma.financeTransaction.findUnique({
      where: { id: params.id },
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Check access
    const role = session.user?.role
    const userId = session.user?.id
    if (role !== "ADMIN" && existingTransaction.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = financeSchema.parse({
      ...body,
      amount: parseFloat(body.amount),
    })

    const transaction = await prisma.financeTransaction.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        type: validatedData.type,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        description: validatedData.description || null,
        receiptUrl: validatedData.receiptUrl ?? existingTransaction.receiptUrl,
      },
    })

    // Log activity
    await createActivityLog({
      actionType: ActionType.UPDATE,
      module: Module.FINANCE,
      recordId: transaction.id,
      performedBy: session.user!.id,
      oldValues: existingTransaction,
      newValues: transaction,
      description: `Updated ${validatedData.type.toLowerCase()}: ${validatedData.title}`,
    })

    return NextResponse.json(transaction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating finance transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transaction = await prisma.financeTransaction.findUnique({
      where: { id: params.id },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Check access
    const role2 = session.user?.role
    const userId2 = session.user?.id
    if (role2 !== "ADMIN" && transaction.userId !== userId2) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.financeTransaction.delete({
      where: { id: params.id },
    })

    // Log activity
    await createActivityLog({
      actionType: ActionType.DELETE,
      module: Module.FINANCE,
      recordId: params.id,
      performedBy: session.user!.id,
      oldValues: transaction,
      description: `Deleted ${transaction.type.toLowerCase()}: ${transaction.title}`,
    })

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Error deleting finance transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


