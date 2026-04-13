"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EXPENSE_CATEGORIES, UNCATEGORIZED_VALUE } from "@/lib/finance-categories"
import type { RecurringTemplateRow } from "@/components/finance/recurring-templates-manager"
import { Loader2 } from "lucide-react"

const expenseCategoryOptions = EXPENSE_CATEGORIES.filter((c) => c.value !== UNCATEGORIZED_VALUE)

type ExpenseCategoryValue = (typeof expenseCategoryOptions)[number]["value"]

export function RecurringTemplateEditForm({ initial }: { initial: RecurringTemplateRow }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState(initial.title)
  const [amount, setAmount] = useState(String(initial.amount))
  const [monthlyBudget, setMonthlyBudget] = useState(
    initial.monthlyBudgetAmount != null ? String(initial.monthlyBudgetAmount) : ""
  )
  const [dayOfMonth, setDayOfMonth] = useState(String(initial.dayOfMonth))
  const [category, setCategory] = useState<ExpenseCategoryValue>(
    (expenseCategoryOptions.some((c) => c.value === initial.category)
      ? initial.category
      : expenseCategoryOptions[0]?.value) as ExpenseCategoryValue
  )
  const [description, setDescription] = useState(initial.description ?? "")
  const [isActive, setIsActive] = useState(initial.isActive)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const mb = monthlyBudget.trim()
      const res = await fetch(`/api/finance/recurring/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: parseFloat(amount),
          category,
          dayOfMonth: parseInt(dayOfMonth, 10),
          description: description.trim() || null,
          monthlyBudgetAmount: mb === "" ? null : parseFloat(mb),
          isActive,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || "Failed to save")
      router.push("/finance/recurring")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit monthly template</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the bill details, booking day, category, or budget allocation.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{initial.title}</CardTitle>
          <CardDescription>Changes apply to future posts; past Finance rows are unchanged.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ed-title">Title *</Label>
              <Input
                id="ed-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-amount">Bill amount (Rs) *</Label>
              <Input
                id="ed-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-budget">Monthly budget (Rs, optional)</Label>
              <Input
                id="ed-budget"
                type="number"
                step="0.01"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="Same as bill if empty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-day">Day of month *</Label>
              <Input
                id="ed-day"
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Category *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategoryValue)}
              >
                {expenseCategoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ed-desc">Notes (optional)</Label>
              <Input
                id="ed-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                id="ed-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="ed-active" className="font-normal">
                Active (inactive templates won&apos;t appear in &quot;Post all&quot; totals)
              </Label>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/finance/recurring">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
