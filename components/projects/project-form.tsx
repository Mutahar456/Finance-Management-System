"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Project } from "@/types"

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientName: z.string().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("PLANNING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Get today's date in YYYY-MM-DD format for default value
  const todayDate = new Date().toISOString().split("T")[0]

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: project ? {
      name: project.name,
      description: project.description || "",
      clientName: project.clientName || "",
      status: project.status as any,
      priority: project.priority as any,
      startDate: project.startDate ? new Date(project.startDate as any).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate as any).toISOString().split("T")[0] : "",
      budget: (project.budget as any) ? String(project.budget) : "",
    } : {
      startDate: todayDate, // Set default start date to today
    }
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError("")
    try {
      const payload = {
        ...data,
        budget: data.budget ? parseFloat(data.budget) : undefined,
      }
      const url = project ? `/api/projects/${project.id}` : "/api/projects"
      const method = project ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to save project")
      }
      router.push("/projects")
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input id="name" {...register("name")} placeholder="Project Alpha" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientName">Client</Label>
          <Input id="clientName" {...register("clientName")} placeholder="Acme Corp" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" {...register("status")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select id="priority" {...register("priority")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input 
            id="startDate" 
            type="date" 
            {...register("startDate")}
            className="w-full cursor-pointer"
            style={{
              colorScheme: 'light dark',
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input 
            id="endDate" 
            type="date" 
            {...register("endDate")}
            className="w-full cursor-pointer"
            style={{
              colorScheme: 'light dark',
            }}
          />
        </div>
        <div className="space-y-2 md:col-span-2 2xl:col-span-3">
          <Label htmlFor="budget">Budget</Label>
          <Input id="budget" type="number" step="0.01" {...register("budget")} placeholder="10000" />
        </div>
        <div className="space-y-2 md:col-span-2 2xl:col-span-3">
          <Label htmlFor="description">Description</Label>
          <textarea id="description" {...register("description")} className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Project goals and scope" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : project ? "Update Project" : "Create Project"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}


