"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Assignment = { userId: string; role: string; user?: { id: string; name: string; email: string } }
type UserOpt = { id: string; name: string; email: string }

export function UserAssignment({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [users, setUsers] = useState<UserOpt[]>([])
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState("DEVELOPER")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const load = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) return
      const proj = await res.json()
      setAssignments(proj.assignments || [])
    } catch {}
  }

  useEffect(() => {
    load()
    ;(async () => {
      try {
        const ur = await fetch('/api/users')
        if (ur.ok) {
          const list = await ur.json()
          setUsers(list)
          if (list.length > 0) setUserId(list[0].id)
        }
      } catch {}
    })()
  }, [])

  const assign = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/projects/${projectId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to assign")
      // Optimistic: append/replace in current list
      setAssignments((prev) => {
        const others = prev.filter((a) => a.userId !== data.user.id)
        return [...others, { userId: data.user.id, role: data.role, user: data.user }]
      })
      setUserId("")
      setRole("DEVELOPER")
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  const unassign = async (userId: string) => {
    if (!confirm("Remove this user from project?")) return
    try {
      const res = await fetch(`/api/projects/${projectId}/assign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error("Failed")
      setAssignments((prev) => prev.filter((a) => a.userId !== userId))
      router.refresh()
    } catch {}
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="user">Select User</Label>
          <select id="user" value={userId} onChange={(e) => setUserId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">-- Select user --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Role</Label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="DEVELOPER">Developer</option>
            <option value="DESIGNER">Designer</option>
            <option value="TESTER">Tester</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>
      <div>
        <Button onClick={assign} disabled={loading || !userId}>Assign User</Button>
      </div>
      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium">Assigned Users</div>
        {assignments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No users assigned.</div>
        ) : (
          <ul className="space-y-1">
            {assignments.map((a) => (
              <li key={a.userId} className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <span className="font-medium">{a.user?.name || a.userId}</span>
                  <span className="ml-2 text-muted-foreground">{a.user?.email}</span>
                  <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">{a.role}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => unassign(a.userId)}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


