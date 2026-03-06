import { ProjectStatus, ProjectPriority } from "@prisma/client"

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, string> = {
    PLANNING: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    ON_HOLD: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${map[status]}`}>{status.replace("_", " ")}</span>
  )
}

export function ProjectPriorityBadge({ priority }: { priority: ProjectPriority }) {
  const map: Record<ProjectPriority, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-sky-100 text-sky-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  }
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${map[priority]}`}>{priority}</span>
  )
}


