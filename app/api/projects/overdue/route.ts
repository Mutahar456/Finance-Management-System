import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    if (session.user?.role === "ADMIN") {
      const projects = await prisma.project.findMany({ include: { assignments: true } })
      const results = [] as Array<{ projectId: string; overdueUserIds: string[] }>
      for (const p of projects) {
        const userIds = p.assignments.map(a => a.userId)
        if (userIds.length === 0) continue
        const recent = await prisma.projectUpdate.findMany({ where: { projectId: p.id, userId: { in: userIds }, createdAt: { gte: since } }, select: { userId: true } })
        const recentSet = new Set(recent.map(r => r.userId))
        const overdueUserIds = userIds.filter(id => !recentSet.has(id))
        if (overdueUserIds.length > 0) results.push({ projectId: p.id, overdueUserIds })
      }
      return NextResponse.json({ overdue: results })
    } else {
      const assignments = await prisma.projectAssignment.findMany({ where: { userId: session.user!.id }, select: { projectId: true } })
      const projectIds = assignments.map(a => a.projectId)
      if (projectIds.length === 0) return NextResponse.json({ overdue: [] })
      const recent = await prisma.projectUpdate.findFirst({ where: { userId: session.user!.id, projectId: { in: projectIds }, createdAt: { gte: since } } })
      const overdue = [] as string[]
      if (!recent) overdue.push(...projectIds)
      return NextResponse.json({ overdue })
    }
  } catch (e) {
    console.error("Error calculating overdue updates:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


