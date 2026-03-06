import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"

const updateSchema = z.object({
  content: z.string().min(3, "Update content is too short"),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Access check: same as project visibility
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { assignments: true },
    })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (session.user?.role !== "ADMIN") {
      const hasAccess = project.createdBy === session.user!.id || project.assignments.some(a => a.userId === session.user!.id)
      if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updates = await prisma.projectUpdate.findMany({
      where: { projectId: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    return NextResponse.json(updates)
  } catch (e) {
    console.error("Error fetching updates:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const data = updateSchema.parse(body)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { assignments: true },
    })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Only ADMIN, creator, or assigned users can post updates
    const canPost = session.user?.role === "ADMIN" || project.createdBy === session.user!.id || project.assignments.some(a => a.userId === session.user!.id)
    if (!canPost) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const update = await prisma.projectUpdate.create({
      data: {
        projectId: params.id,
        userId: session.user!.id,
        content: data.content,
      },
    })

    await createActivityLog({
      actionType: ActionType.CREATE,
      module: Module.PROJECTS,
      recordId: update.id,
      performedBy: session.user!.id,
      newValues: update,
      description: `Daily update on project ${project.name}`,
    })

    return NextResponse.json(update, { status: 201 })
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: e.errors?.[0]?.message || 'Invalid input' }, { status: 400 })
    }
    console.error("Error posting update:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


