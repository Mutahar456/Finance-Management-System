import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FinanceForm } from "@/components/finance/finance-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"

export default async function FinanceTransactionPage({
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

  const transaction = await prisma.financeTransaction.findUnique({
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

  if (!transaction) {
    redirect("/finance")
  }

  // Check access
  const role = session.user?.role
  const userId = session.user?.id
  if (role !== "ADMIN" && transaction.userId !== userId) {
    redirect("/finance")
  }

  const isEditMode = searchParams.edit === "true"

  if (isEditMode) {
    return (
      <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Transaction</h1>
          <p className="text-sm md:text-base text-muted-foreground">Update transaction details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <FinanceForm transaction={transaction} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSalaryExpense = transaction.type === "EXPENSE" && transaction.category === "salaries"

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{transaction.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground">View transaction details</p>
        </div>
        {isSalaryExpense && (
          <Button asChild className="gap-2 shrink-0">
            <Link href={`/finance/salary-slip/${transaction.id}`}>
              <FileText className="h-4 w-4" />
              Print salary slip
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="text-base md:text-lg">{transaction.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    transaction.type === "INCOME"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {transaction.type}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className={`text-xl md:text-2xl font-bold ${
                  transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Number(transaction.amount))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-base md:text-lg">{formatDate(transaction.date)}</p>
              </div>
              {transaction.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-base md:text-lg">{transaction.description}</p>
                </div>
              )}
              {isSalaryExpense && (
                <>
                  {(transaction as { salaryEmployeeName?: string | null }).salaryEmployeeName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Employee (slip)</p>
                      <p className="text-base md:text-lg">
                        {(transaction as { salaryEmployeeName?: string | null }).salaryEmployeeName}
                      </p>
                    </div>
                  )}
                  {(transaction as { salaryBankAccount?: string | null }).salaryBankAccount && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account no.</p>
                      <p className="font-mono text-base md:text-lg">
                        {(transaction as { salaryBankAccount?: string | null }).salaryBankAccount}
                      </p>
                    </div>
                  )}
                </>
              )}
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
              <p className="text-base md:text-lg">{transaction.user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base md:text-lg">{formatDate(transaction.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


