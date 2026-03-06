import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"
import { z } from "zod"

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  purchaseDate: z.string(),
  supplier: z.string().min(1, "Supplier is required"),
  unitPrice: z.number().positive("Unit price must be positive"),
  imageUrl: z.string().url().optional().or(z.literal("")),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = {}
    if (session.user?.role !== "ADMIN") {
      where.userId = session.user!.id
    }
    if (category) {
      where.category = category
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
      ]
    }

    const items = await prisma.inventoryItem.findMany({
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
        createdAt: "desc",
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching inventory:", error)
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
    const validatedData = inventorySchema.parse({
      ...body,
      quantity: parseInt(body.quantity),
      unitPrice: parseFloat(body.unitPrice),
    })

    const totalValue = validatedData.quantity * validatedData.unitPrice

    const item = await prisma.inventoryItem.create({
      data: {
        name: validatedData.name,
        category: validatedData.category,
        quantity: validatedData.quantity,
        purchaseDate: new Date(validatedData.purchaseDate),
        supplier: validatedData.supplier,
        unitPrice: validatedData.unitPrice,
        totalValue,
        imageUrl: validatedData.imageUrl || null,
        userId: session.user!.id,
      },
    })

    // Log activity
    await createActivityLog({
      actionType: ActionType.CREATE,
      module: Module.INVENTORY,
      recordId: item.id,
      performedBy: session.user!.id,
      newValues: item,
      description: `Created inventory item: ${item.name}`,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating inventory item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


