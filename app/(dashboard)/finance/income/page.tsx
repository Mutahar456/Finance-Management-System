import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FinanceForm } from "@/components/finance/finance-form"

export const dynamic = 'force-dynamic'

export default function AddIncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Income</h1>
        <p className="text-muted-foreground">Record a new income transaction</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceForm defaultType="INCOME" />
        </CardContent>
      </Card>
    </div>
  )
}


