import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module, ProjectRole } from "@prisma/client"

const assignSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(ProjectRole).default("DEVELOPER" as ProjectRole),
}).refine((d) => d.userId || d.email, { message: "userId or email is required" })

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({ where: { id: params.id }, include: { assignments: true } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Only ADMIN or project creator can assign
    if (session.user?.role !== "ADMIN" && project.createdBy !== session.user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = assignSchema.parse(body)

    const user = data.userId
      ? await prisma.user.findUnique({ where: { id: data.userId } })
      : await prisma.user.findUnique({ where: { email: data.email as string } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const assignment = await prisma.projectAssignment.upsert({
      where: { projectId_userId: { projectId: params.id, userId: user.id } },
      update: { role: data.role, assignedBy: session.user!.id },
      create: { projectId: params.id, userId: user.id, role: data.role, assignedBy: session.user!.id },
    })

    await createActivityLog({
      actionType: ActionType.CREATE,
      module: Module.PROJECTS,
      recordId: assignment.id,
      performedBy: session.user!.id,
      newValues: assignment,
      description: `Assigned ${user.email} as ${data.role}`,
    })

    // Create a notification for the assigned user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'PROJECT_ASSIGNED',
        message: `You have been assigned to project "${project.name}" as ${assignment.role}`,
        link: `/projects/${params.id}`,
      },
    })

    const withUser = await prisma.projectAssignment.findUnique({ where: { projectId_userId: { projectId: params.id, userId: user.id } }, include: { user: { select: { id: true, name: true, email: true } } } })
    return NextResponse.json(withUser, { status: 201 })
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: e.errors?.[0]?.message || 'Invalid input' }, { status: 400 })
    }
    console.error("Error assigning:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const unassignSchema = z.object({ userId: z.string().min(1) })

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findUnique({ where: { id: params.id } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user?.role !== "ADMIN" && project.createdBy !== session.user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = unassignSchema.parse(body)

    const existing = await prisma.projectAssignment.findUnique({ where: { projectId_userId: { projectId: params.id, userId: data.userId } } })
    if (!existing) return NextResponse.json({ error: "Not assigned" }, { status: 404 })

    await prisma.projectAssignment.delete({ where: { projectId_userId: { projectId: params.id, userId: data.userId } } })

    await createActivityLog({
      actionType: ActionType.DELETE,
      module: Module.PROJECTS,
      recordId: existing.id,
      performedBy: session.user!.id,
      oldValues: existing,
      description: `Unassigned user ${data.userId}`,
    })

    return NextResponse.json({ message: "Unassigned" })
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: e.errors?.[0]?.message || 'Invalid input' }, { status: 400 })
    }
    console.error("Error unassigning:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


