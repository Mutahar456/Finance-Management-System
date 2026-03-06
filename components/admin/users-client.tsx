"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
// Using native select/checkbox and simple badges to avoid missing UI deps

export default function UsersClient() {
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER', isActive: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pwdUser, setPwdUser] = useState<{ id: string, email: string } | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/users', { cache: 'no-store' })
    if (res.ok) setUsers(await res.json())
  }

  useEffect(() => { load() }, [])

  const createUser = async () => {
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email and password are required.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setUsers([data, ...users])
      setForm({ name: '', email: '', password: '', role: 'USER', isActive: true })
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  const updateUser = async (id: string, patch: any) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    const data = await res.json()
    if (res.ok) setUsers(users.map(u => u.id === id ? data : u))
  }

  const doReset = async (u: any) => {
    const next = prompt('Enter new password for ' + u.email)
    if (!next) return
    if (next.length < 6) { setError('New password must be at least 6 characters.'); return }
    await updateUser(u.id, { password: next })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="mb-3 text-lg font-semibold">Create New User</div>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <Button onClick={createUser} disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
        {error && <div className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
      </div>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between p-4">
          <div className="text-lg font-semibold">All Users</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/40 text-left text-muted-foreground">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'ADMIN' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{u.role}</span>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { isActive: !u.isActive })}>{u.isActive ? 'Deactivate' : 'Activate'}</Button>
                      <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}>Toggle Role</Button>
                    <Button variant="outline" size="sm" onClick={() => doReset(u)}>Reset Password</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


