import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FinanceForm } from "@/components/finance/finance-form"

export const dynamic = 'force-dynamic'

export default function AddExpensePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Expense</h1>
        <p className="text-muted-foreground">Record a new expense transaction</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceForm defaultType="EXPENSE" />
        </CardContent>
      </Card>
    </div>
  )
}


