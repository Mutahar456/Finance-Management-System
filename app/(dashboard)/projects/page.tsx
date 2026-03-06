import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { ProjectTable } from "@/components/projects/project-table"

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user?.role
  const userId = session.user?.id
  const where = role === "ADMIN" ? {} : {
    OR: [
      { createdBy: userId },
      { assignments: { some: { userId: userId } } },
    ],
  }

  const projects = await prisma.project.findMany({ where, orderBy: { updatedAt: "desc" }, include: { assignments: true } })

  const now = Date.now()
  const enriched = await Promise.all(projects.map(async (p) => {
    if (role === "ADMIN") {
      const userIds = p.assignments.map(a => a.userId)
      if (userIds.length === 0) return { ...p, updatedForUser: true, overdueCount: 0 }
      const since = new Date(now - 24 * 60 * 60 * 1000)
      const recent = await prisma.projectUpdate.findMany({
        where: { projectId: p.id, userId: { in: userIds }, createdAt: { gte: since } },
        select: { userId: true },
      })
      const recentSet = new Set(recent.map(r => r.userId))
      const overdueCount = userIds.filter(id => !recentSet.has(id)).length
      return { ...p, budget: p.budget ? Number(p.budget) : null, updatedForUser: overdueCount === 0, overdueCount }
    } else {
      const last = await prisma.projectUpdate.findFirst({ where: { projectId: p.id, userId: userId! }, orderBy: { createdAt: "desc" } })
      const updatedForUser = !!last && (now - new Date(last.createdAt).getTime()) <= 24 * 60 * 60 * 1000
      return { ...p, budget: p.budget ? Number(p.budget) : null, updatedForUser, overdueCount: undefined as unknown as number }
    }
  }))

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage software projects</p>
        </div>
        <Link href="/projects/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectTable projects={enriched as any} />
        </CardContent>
      </Card>
    </div>
  )
}


