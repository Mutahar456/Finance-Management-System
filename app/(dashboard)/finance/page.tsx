import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, TrendingUp, TrendingDown } from "lucide-react"
import { FinanceTable } from "@/components/finance/finance-table"

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const role = session.user?.role
  const userId = session.user?.id

  const transactions = await prisma.financeTransaction.findMany({
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
      date: "desc",
    },
  })

  const income = await prisma.financeTransaction.aggregate({
    where: {
      type: "INCOME",
      userId: role === "ADMIN" ? undefined : userId,
    },
    _sum: { amount: true },
  })

  const expenses = await prisma.financeTransaction.aggregate({
    where: {
      type: "EXPENSE",
      userId: role === "ADMIN" ? undefined : userId,
    },
    _sum: { amount: true },
  })

  const totalIncome = Number(income._sum.amount || 0)
  const totalExpenses = Number(expenses._sum.amount || 0)
  const balance = totalIncome - totalExpenses

  const plainTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Finance Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/income" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Income</span>
              <span className="sm:hidden">Income</span>
            </Button>
          </Link>
          <Link href="/finance/expense" className="flex-1 sm:flex-none">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Expense</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs {totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rs {totalExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              Rs {balance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceTable transactions={plainTransactions as any} />
        </CardContent>
      </Card>
    </div>
  )
}


