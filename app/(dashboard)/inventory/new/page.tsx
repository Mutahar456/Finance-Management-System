import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InventoryForm } from "@/components/inventory/inventory-form"

export const dynamic = 'force-dynamic'

export default function NewInventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Inventory Item</h1>
        <p className="text-muted-foreground">Create a new inventory item</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryForm />
        </CardContent>
      </Card>
    </div>
  )
}


