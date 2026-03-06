import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogsTable } from "@/components/logs/logs-table"

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const role = session.user?.role
  const userId = session.user?.id

  const logs = await prisma.activityLog.findMany({
    where: role === "ADMIN" ? {} : { performedBy: userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 100,
  })

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Activity Logs</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {role === "ADMIN" 
            ? "View all system activity" 
            : "View your activity history"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <LogsTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}


