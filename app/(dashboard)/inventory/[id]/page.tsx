import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InventoryForm } from "@/components/inventory/inventory-form"
import Image from "next/image"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function InventoryItemPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { edit?: string }
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
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
    redirect("/inventory")
  }

  // Check access
  const role = session.user?.role
  const userId = session.user?.id
  if (role !== "ADMIN" && item.userId !== userId) {
    redirect("/inventory")
  }

  const isEditMode = searchParams.edit === "true"

  if (isEditMode) {
    return (
      <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Inventory Item</h1>
          <p className="text-sm md:text-base text-muted-foreground">Update item details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryForm item={item} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{item.name}</h1>
        <p className="text-sm md:text-base text-muted-foreground">View inventory item details</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.imageUrl && (
              <div className="flex justify-center lg:justify-start">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={300}
                  height={300}
                  className="rounded-lg object-cover w-full max-w-sm"
                />
              </div>
            )}
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base md:text-lg">{item.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-base md:text-lg">{item.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                <p className="text-base md:text-lg">{item.quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                <p className="text-base md:text-lg">{formatCurrency(Number(item.unitPrice))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(Number(item.totalValue))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="text-base md:text-lg">{item.supplier}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                <p className="text-base md:text-lg">{formatDate(item.purchaseDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-base md:text-lg">{item.user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base md:text-lg">{formatDate(item.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


