import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"
import { z } from "zod"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientName: z.string().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const where = session.user?.role === "ADMIN" ? {} : {
      OR: [
        { createdBy: session.user!.id },
        { assignments: { some: { userId: session.user!.id } } },
      ],
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        assignments: { select: { userId: true } },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const data = projectSchema.parse({
      ...body,
      budget: body.budget ? parseFloat(body.budget) : undefined,
    })

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        clientName: data.clientName || null,
        status: data.status || "PLANNING",
        priority: data.priority || "MEDIUM",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget ?? null,
        createdBy: session.user!.id,
      },
    })

    await createActivityLog({
      actionType: ActionType.CREATE,
      module: Module.PROJECTS,
      recordId: project.id,
      performedBy: session.user!.id,
      newValues: project,
      description: `Created project: ${project.name}`,
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


