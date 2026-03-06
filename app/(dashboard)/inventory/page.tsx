import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { InventoryTable } from "@/components/inventory/inventory-table"

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const role = (session as any).user?.role as string | undefined
  const userId = (session as any).user?.id as string | undefined

  const items = await prisma.inventoryItem.findMany({
    where: role === "ADMIN" ? {} : { userId: userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const categories = await prisma.inventoryItem.findMany({
    select: {
      category: true,
    },
    distinct: ["category"],
  })

  const plainItems = items.map((it) => ({
    ...it,
    unitPrice: Number(it.unitPrice),
    totalValue: Number(it.totalValue),
    purchaseDate: it.purchaseDate.toISOString(),
    createdAt: it.createdAt.toISOString(),
    updatedAt: it.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your inventory items</p>
        </div>
        <Link href="/inventory/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryTable items={plainItems as any} categories={categories.map(c => c.category)} />
        </CardContent>
      </Card>
    </div>
  )
}


