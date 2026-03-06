import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectStatusBadge, ProjectPriorityBadge } from "@/components/projects/project-status-badge"
import { DailyUpdateForm } from "@/components/projects/daily-update-form"
import { UserAssignment } from "@/components/projects/user-assignment"
import { prisma } from "@/lib/prisma"

export default async function ProjectDetailPage({ params, searchParams }: { params: { id: string }, searchParams: { edit?: string } }) {
  const session = await auth()
  if (!session) redirect("/login")

  const project = await prisma.project.findUnique({ where: { id: params.id }, include: { assignments: true, creator: true } })
  if (!project) redirect("/projects")

  const role = session.user?.role
  const userId = session.user?.id
  if (role !== "ADMIN") {
    const hasAccess = project.createdBy === userId || project.assignments.some(a => a.userId === userId)
    if (!hasAccess) redirect("/projects")
  }

  const isEdit = searchParams.edit === "true"

  const lastUpdate = await prisma.projectUpdate.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  })
  const isStale = !lastUpdate || (Date.now() - new Date(lastUpdate.createdAt).getTime()) > 24 * 60 * 60 * 1000

  if (isEdit) {
    return (
      <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Project</h1>
          <p className="text-sm md:text-base text-muted-foreground">Update project details</p>
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectForm project={{ ...project, budget: project.budget ? Number(project.budget as any) : null } as any} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent>
              <UserAssignment projectId={project.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{project.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Client: {project.clientName || '-'} | Owner: {project.creator.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors" href={`/projects/${project.id}/invoices`}>Manage Invoices</a>
          <ProjectStatusBadge status={project.status as any} />
          <ProjectPriorityBadge priority={project.priority as any} />
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Dates</p>
              <p className="text-base md:text-lg">{project.startDate ? new Date(project.startDate as any).toLocaleDateString() : '-'} → {project.endDate ? new Date(project.endDate as any).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-base md:text-lg">{project.budget ? `Rs ${project.budget}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Update Status</p>
              <p className={`text-base md:text-lg font-semibold ${isStale ? 'text-red-600' : 'text-green-600'}`}>
                {isStale ? 'Unupdated (no update in last 24h)' : 'Updated today'}
              </p>
              {lastUpdate && <p className="text-xs text-muted-foreground">Last update: {new Date(lastUpdate.createdAt as any).toLocaleString()}</p>}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-base md:text-lg whitespace-pre-line">{project.description || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent>
            <UserAssignment projectId={project.id} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Your Daily Update</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyUpdateForm projectId={project.id} />
        </CardContent>
      </Card>
    </div>
  )
}


