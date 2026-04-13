import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard"

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

  const categoryTabs = Array.from(
    new Map(
      categories.map((c) => {
        const label = c.category.trim()
        return [label.toLowerCase(), label] as const
      })
    ).values()
  ).sort((a, b) => a.localeCompare(b))

  return (
    <div className="mx-auto max-w-7xl space-y-4 2xl:max-w-[1800px] md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Inventory</h1>
          <p className="text-xs text-muted-foreground sm:text-sm md:text-base">Stock, value &amp; categories</p>
        </div>
        <Link href="/inventory/new" className="w-full sm:w-auto">
          <Button size="sm" className="h-9 w-full gap-1.5 sm:h-10 sm:w-auto">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add item
          </Button>
        </Link>
      </div>

      <InventoryDashboard items={plainItems as any} categories={categoryTabs} />
    </div>
  )
}


