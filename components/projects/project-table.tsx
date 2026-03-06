"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Project } from "@/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProjectStatusBadge, ProjectPriorityBadge } from "./project-status-badge"
import { Edit, Trash2, Eye } from "lucide-react"

type ProjectRow = Project & { updatedForUser?: boolean; overdueCount?: number }

export function ProjectTable({ projects: initial }: { projects: ProjectRow[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initial)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const filtered = projects.filter(p => {
    const q = query.toLowerCase()
    const matches = !q || p.name.toLowerCase().includes(q) || (p.clientName || "").toLowerCase().includes(q)
    const s = !status || p.status === status
    const pr = !priority || p.priority === priority
    return matches && s && pr
  })

  const onDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return
    setLoading({ ...loading, [id]: true })
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setProjects(projects.filter(p => p.id !== id))
    } catch {
      alert("Failed to delete project")
    } finally {
      setLoading({ ...loading, [id]: false })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" placeholder="Search by name or client" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Update</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No projects found</TableCell>
              </TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.clientName || "-"}</TableCell>
                <TableCell><ProjectStatusBadge status={p.status as any} /></TableCell>
                <TableCell><ProjectPriorityBadge priority={p.priority as any} /></TableCell>
                <TableCell>
                  {typeof p.overdueCount === 'number' ? (
                    p.overdueCount > 0 ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">{p.overdueCount} overdue</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">All updated</span>
                    )
                  ) : (
                    p.updatedForUser ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Updated</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Unupdated</span>
                    )
                  )}
                </TableCell>
                <TableCell>{p.startDate ? new Date(p.startDate as any).toLocaleDateString() : "-"} → {p.endDate ? new Date(p.endDate as any).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${p.id}`)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${p.id}?edit=true`)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${p.id}/invoices`)}>Invoices</Button>
                    <Button variant="ghost" size="icon" disabled={loading[p.id]} onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No projects found</div>
        ) : filtered.map(p => (
          <div key={p.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{p.name}</h3>
                {p.clientName && <p className="text-sm text-muted-foreground">Client: {p.clientName}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ProjectStatusBadge status={p.status as any} />
              <ProjectPriorityBadge priority={p.priority as any} />
              {typeof p.overdueCount === 'number' ? (
                p.overdueCount > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">{p.overdueCount} overdue</span>
                ) : (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">All updated</span>
                )
              ) : (
                p.updatedForUser ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Updated</span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Unupdated</span>
                )
              )}
            </div>
            {(p.startDate || p.endDate) && (
              <div className="text-sm text-muted-foreground">
                {p.startDate ? new Date(p.startDate as any).toLocaleDateString() : "-"} → {p.endDate ? new Date(p.endDate as any).toLocaleDateString() : "-"}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/projects/${p.id}`)}><Eye className="h-4 w-4 mr-1" />View</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/projects/${p.id}?edit=true`)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/projects/${p.id}/invoices`)}>Manage Invoices</Button>
                <Button variant="outline" size="sm" disabled={loading[p.id]} onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


