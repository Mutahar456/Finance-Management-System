import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, DollarSign, TrendingUp, FolderKanban } from "lucide-react"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Get stats
  const role = session.user?.role
  const userId = session.user?.id
  const [totalItems, totalValue, totalIncome, totalExpenses, totalProjects, ongoingProjects] = await Promise.all([
    prisma.inventoryItem.count({ where: { userId: role === "ADMIN" ? undefined : userId } }),
    prisma.inventoryItem.aggregate({
      where: { userId: role === "ADMIN" ? undefined : userId },
      _sum: { totalValue: true },
    }),
    prisma.financeTransaction.aggregate({
      where: { 
        userId: role === "ADMIN" ? undefined : userId,
        type: "INCOME"
      },
      _sum: { amount: true },
    }),
    prisma.financeTransaction.aggregate({
      where: { 
        userId: role === "ADMIN" ? undefined : userId,
        type: "EXPENSE"
      },
      _sum: { amount: true },
    }),
    prisma.project.count({
      where: role === "ADMIN" ? {} : {
        assignments: {
          some: {
            userId: userId!
          }
        }
      }
    }),
    prisma.project.count({
      where: {
        status: "IN_PROGRESS",
        ...(role !== "ADMIN" ? {
          assignments: {
            some: {
              userId: userId!
            }
          }
        } : {})
      }
    }),
  ])

  const inventoryValue = totalValue._sum.totalValue || 0
  const income = totalIncome._sum.amount || 0
  const expenses = totalExpenses._sum.amount || 0
  const balance = Number(income) - Number(expenses)

  const stats = [
    {
      title: "Total Inventory Items",
      value: totalItems.toString(),
      description: "Items in stock",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Total Inventory Value",
      value: `Rs ${Number(inventoryValue).toLocaleString()}`,
      description: "Total asset value",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Balance",
      value: `Rs ${balance.toLocaleString()}`,
      description: "Income - Expenses",
      icon: TrendingUp,
      color: balance >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Ongoing Projects",
      value: ongoingProjects.toString(),
      description: "Active projects",
      icon: FolderKanban,
      color: "text-purple-600",
    },
  ]

  // Recent activity (last 10)
  const recent = await prisma.activityLog.findMany({
    where: role === "ADMIN" ? {} : { performedBy: userId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { timestamp: "desc" },
    take: 10,
  })

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome back, {session.user?.name}</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                recent.map((log) => (
                  <div key={log.id} className="rounded-md border p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="text-sm font-medium">{log.module} · {log.actionType}</div>
                      <div className="text-xs text-muted-foreground">{new Date(log.timestamp as any).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{log.description || '—'}</div>
                    <div className="text-xs text-muted-foreground mt-1">By: {log.user?.name}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a href="/projects/new" className="rounded-md bg-primary px-3 py-2 text-sm text-center text-primary-foreground hover:bg-primary/90 transition-colors">New Project</a>
              <a href="/inventory/new" className="rounded-md border px-3 py-2 text-sm text-center hover:bg-accent transition-colors">Add Inventory Item</a>
              <a href="/finance/income" className="rounded-md border px-3 py-2 text-sm text-center hover:bg-accent transition-colors">Add Income</a>
              <a href="/finance/expense" className="rounded-md border px-3 py-2 text-sm text-center hover:bg-accent transition-colors">Add Expense</a>
              <a href="/logs" className="rounded-md border px-3 py-2 text-sm text-center hover:bg-accent transition-colors sm:col-span-2">View Logs</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


