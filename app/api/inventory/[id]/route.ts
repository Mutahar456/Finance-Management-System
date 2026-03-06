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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Check access
    if (session.user?.role !== "ADMIN" && item.userId !== session.user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Check access
    if (session.user?.role !== "ADMIN" && existingItem.userId !== session.user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = inventorySchema.parse({
      ...body,
      quantity: parseInt(body.quantity),
      unitPrice: parseFloat(body.unitPrice),
    })

    const totalValue = validatedData.quantity * validatedData.unitPrice

    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        category: validatedData.category,
        quantity: validatedData.quantity,
        purchaseDate: new Date(validatedData.purchaseDate),
        supplier: validatedData.supplier,
        unitPrice: validatedData.unitPrice,
        totalValue,
        imageUrl: validatedData.imageUrl || null,
      },
    })

    // Log activity
    await createActivityLog({
      actionType: ActionType.UPDATE,
      module: Module.INVENTORY,
      recordId: item.id,
      performedBy: session.user!.id,
      oldValues: existingItem,
      newValues: item,
      description: `Updated inventory item: ${item.name}`,
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating inventory item:", error)
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

    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Check access
    if (session.user?.role !== "ADMIN" && item.userId !== session.user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.inventoryItem.delete({
      where: { id: params.id },
    })

    // Log activity
    await createActivityLog({
      actionType: ActionType.DELETE,
      module: Module.INVENTORY,
      recordId: params.id,
      performedBy: session.user!.id,
      oldValues: item,
      description: `Deleted inventory item: ${item.name}`,
    })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


