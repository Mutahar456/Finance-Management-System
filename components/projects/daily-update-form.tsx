"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function DailyUpdateForm({ projectId, onPosted }: { projectId: string, onPosted?: () => void }) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/projects/${projectId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to post update")
      }
      setContent("")
      onPosted?.()
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <Label htmlFor="update">Daily Update</Label>
      <textarea id="update" value={content} onChange={(e) => setContent(e.target.value)} placeholder="What did you do today?" className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={loading || content.trim().length < 3}>{loading ? "Posting..." : "Post Update"}</Button>
      </div>
    </div>
  )
}


