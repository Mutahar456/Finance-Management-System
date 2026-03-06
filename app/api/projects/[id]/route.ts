import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"
import { z } from "zod"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").optional(),
  description: z.string().optional(),
  clientName: z.string().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user?.role !== "ADMIN") {
      const hasAccess = project.createdBy === session.user!.id || project.assignments.some(a => a.userId === session.user!.id)
      if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const existing = await prisma.project.findUnique({ where: { id: params.id }, include: { assignments: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user?.role !== "ADMIN") {
      const hasAccess = existing.createdBy === session.user!.id || existing.assignments.some(a => a.userId === session.user!.id)
      if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = projectSchema.parse({
      ...body,
      budget: body.budget ? parseFloat(body.budget) : undefined,
    })

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        clientName: data.clientName ?? existing.clientName,
        status: data.status ?? existing.status,
        priority: data.priority ?? existing.priority,
        startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
        endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
        budget: data.budget ?? existing.budget,
      },
    })

    await createActivityLog({
      actionType: ActionType.UPDATE,
      module: Module.PROJECTS,
      recordId: updated.id,
      performedBy: session.user!.id,
      oldValues: existing,
      newValues: updated,
      description: `Updated project: ${updated.name}`,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const existing = await prisma.project.findUnique({ where: { id: params.id }, include: { assignments: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user?.role !== "ADMIN") {
      const hasAccess = existing.createdBy === session.user!.id || existing.assignments.some(a => a.userId === session.user!.id)
      if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.project.delete({ where: { id: params.id } })

    await createActivityLog({
      actionType: ActionType.DELETE,
      module: Module.PROJECTS,
      recordId: params.id,
      performedBy: session.user!.id,
      oldValues: existing,
      description: `Deleted project: ${existing.name}`,
    })

    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


