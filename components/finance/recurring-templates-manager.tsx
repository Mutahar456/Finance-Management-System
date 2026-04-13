"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EXPENSE_CATEGORIES, getCategoryLabel, UNCATEGORIZED_VALUE } from "@/lib/finance-categories"
import { effectiveMonthlyBudget, budgetUtilizationPercent } from "@/lib/recurring-budget"
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  PieChart,
  Plus,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react"

export type RecurringTemplateRow = {
  id: string
  title: string
  description: string | null
  category: string
  amount: number
  monthlyBudgetAmount: number | null
  dayOfMonth: number
  isActive: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

const expenseCategoryOptions = EXPENSE_CATEGORIES.filter((c) => c.value !== UNCATEGORIZED_VALUE)

type ExpenseCategoryValue = (typeof expenseCategoryOptions)[number]["value"]

function monthHref(y: number, m: number) {
  return `/finance/recurring?y=${y}&m=${m}`
}

function shiftMonth(y: number, m: number, delta: number) {
  const d = new Date(y, m - 1 + delta, 1)
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

function formatRs(n: number) {
  return `Rs ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function RecurringTemplatesManager({
  initialTemplates,
  viewYear,
  viewMonth,
  spentByTemplateId,
  postedFinanceTxIdsByTemplateId,
  budgetSummary,
}: {
  initialTemplates: RecurringTemplateRow[]
  viewYear: number
  viewMonth: number
  spentByTemplateId: Record<string, number>
  /** Finance transaction IDs for this template in the viewed month — used to remove a mistaken post. */
  postedFinanceTxIdsByTemplateId: Record<string, string[]>
  budgetSummary: { totalPlanned: number; totalSpent: number; remaining: number }
}) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [loading, setLoading] = useState(false)
  const [postingId, setPostingId] = useState<string | null>(null)
  const [unpostingId, setUnpostingId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [error, setError] = useState("")
  const [savingBudgetId, setSavingBudgetId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [monthlyBudget, setMonthlyBudget] = useState("")
  const [category, setCategory] = useState<ExpenseCategoryValue>(
    expenseCategoryOptions[0]?.value ?? "office_rent"
  )
  const [dayOfMonth, setDayOfMonth] = useState("1")
  const [description, setDescription] = useState("")

  const prev = shiftMonth(viewYear, viewMonth, -1)
  const next = shiftMonth(viewYear, viewMonth, 1)

  const refresh = async () => {
    const res = await fetch("/api/finance/recurring")
    if (res.ok) {
      const data = await res.json()
      setTemplates(
        data.map(
          (t: RecurringTemplateRow & { amount: unknown; monthlyBudgetAmount?: unknown }) => {
            const raw = t.monthlyBudgetAmount as unknown
            const mbNum =
              raw == null || raw === "" ? null : Number(raw)
            return {
              ...t,
              amount: Number(t.amount),
              monthlyBudgetAmount:
                mbNum != null && !Number.isNaN(mbNum) && mbNum > 0 ? mbNum : null,
            }
          }
        )
      )
    }
  }

  const addTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const mb = monthlyBudget.trim()
      const res = await fetch("/api/finance/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: parseFloat(amount),
          category,
          dayOfMonth: parseInt(dayOfMonth, 10),
          description: description.trim() || null,
          monthlyBudgetAmount: mb === "" ? null : parseFloat(mb),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || "Failed to save")
      setTitle("")
      setAmount("")
      setMonthlyBudget("")
      setDescription("")
      setDayOfMonth("1")
      await refresh()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  const saveBudget = async (id: string, raw: string) => {
    setSavingBudgetId(id)
    setError("")
    try {
      const trimmed = raw.trim()
      const monthlyBudgetAmount = trimmed === "" ? null : parseFloat(trimmed)
      if (monthlyBudgetAmount != null && (Number.isNaN(monthlyBudgetAmount) || monthlyBudgetAmount <= 0)) {
        throw new Error("Budget must be a positive number or empty")
      }
      const res = await fetch(`/api/finance/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudgetAmount }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || "Failed to save budget")
      await refresh()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setSavingBudgetId(null)
    }
  }

  const postOne = async (id: string) => {
    setPostingId(id)
    setError("")
    try {
      const res = await fetch(`/api/finance/recurring/${id}/post?year=${viewYear}&month=${viewMonth}`, {
        method: "POST",
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 409) {
        setError("Already posted for that month — check Finance list.")
      } else if (!res.ok) {
        throw new Error(j.error || "Failed to post")
      }
      router.push("/finance")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setPostingId(null)
    }
  }

  const unpostMonth = async (templateId: string) => {
    const ids = postedFinanceTxIdsByTemplateId[templateId] ?? []
    if (ids.length === 0) return
    const label = `${viewMonth}/${viewYear}`
    const msg =
      ids.length > 1
        ? `Remove ${ids.length} Finance entries for this month (${label})? You can post again later.`
        : `Remove this month’s Finance entry (${label})? You can post again later.`
    if (!confirm(msg)) return
    setUnpostingId(templateId)
    setError("")
    try {
      for (const id of ids) {
        const res = await fetch(`/api/finance/${id}`, { method: "DELETE" })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j.error || "Failed to remove posting")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setUnpostingId(null)
    }
  }

  const postAllMonth = async () => {
    setBulkLoading(true)
    setError("")
    try {
      const res = await fetch("/api/finance/recurring/post-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: viewYear, month: viewMonth }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || "Failed")
      router.push("/finance")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setBulkLoading(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this monthly template? Past transactions stay in the ledger.")) return
    setPostingId(id)
    try {
      const res = await fetch(`/api/finance/recurring/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      router.refresh()
    } catch {
      setError("Could not delete")
    } finally {
      setPostingId(null)
    }
  }

  const utilizationTotal = useMemo(
    () => budgetUtilizationPercent(budgetSummary.totalSpent, budgetSummary.totalPlanned),
    [budgetSummary]
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
      <div className="min-w-0">
        <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
          Monthly expenses
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
          <strong>Budget</strong> = planned Rs per template; <strong>executed</strong> = posted to Finance
          this month. Manage templates below — works on phone, tablet, and desktop.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/finance/expense">
            <Button variant="outline" size="sm">
              One-time expense
            </Button>
          </Link>
          <Link href="/finance">
            <Button variant="ghost" size="sm">
              Back to Finance
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-border/80 bg-muted/20">
        <CardHeader className="space-y-3 pb-2 sm:space-y-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 shrink-0 text-primary" />
              <CardTitle className="text-base sm:text-lg">Budget vs executed</CardTitle>
            </div>
            <div className="flex items-center justify-center gap-1 sm:justify-end">
              <Button variant="outline" size="icon" className="h-10 w-10 sm:h-9 sm:w-9" asChild>
                <Link href={monthHref(prev.y, prev.m)} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <span className="min-w-[8rem] flex-1 text-center text-sm font-medium tabular-nums sm:min-w-[140px] sm:flex-none">
                {viewMonth}/{viewYear}
              </span>
              <Button variant="outline" size="icon" className="h-10 w-10 sm:h-9 sm:w-9" asChild>
                <Link href={monthHref(next.y, next.m)} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <CardDescription className="text-pretty">
            <strong>Executed</strong> = expenses in Finance linked to each template this month. Leave
            budget empty to use the bill <strong>amount</strong> as the plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Total allocated (active)</p>
              <p className="text-lg font-semibold tabular-nums">{formatRs(budgetSummary.totalPlanned)}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Executed this month</p>
              <p className="text-lg font-semibold tabular-nums">{formatRs(budgetSummary.totalSpent)}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Remaining</p>
              <p
                className={`text-lg font-semibold tabular-nums ${
                  budgetSummary.remaining < 0 ? "text-destructive" : ""
                }`}
              >
                {formatRs(budgetSummary.remaining)}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Overall utilization</span>
              <span>{utilizationTotal}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  utilizationTotal > 100 ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, utilizationTotal)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Add a monthly template
          </CardTitle>
          <CardDescription>
            Day of month = booking date. <strong>Monthly budget</strong> is optional — leave empty to
            use the bill amount as your planned allocation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTemplate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="rt-title">Title *</Label>
              <Input
                id="rt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office rent, Internet — Fiber"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-amount">Bill amount (Rs) *</Label>
              <Input
                id="rt-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-budget">Monthly budget (Rs, optional)</Label>
              <Input
                id="rt-budget"
                type="number"
                step="0.01"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="Same as bill if empty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-day">Day of month *</Label>
              <Input
                id="rt-day"
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
              <Label htmlFor="rt-desc">Notes (optional)</Label>
              <Input
                id="rt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Account number, vendor name…"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save template"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarClock className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate">Templates & budget ({viewMonth}/{viewYear})</span>
            </CardTitle>
            <CardDescription className="text-pretty">
              Post this month into Finance — duplicates are blocked. If you posted by mistake, use{" "}
              <strong>Remove posting</strong> on that row to delete the ledger entry (you can post again).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={bulkLoading || templates.length === 0}
            onClick={postAllMonth}
            className="h-10 w-full gap-2 sm:h-9 sm:w-auto"
          >
            {bulkLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Post all for this month
          </Button>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {templates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No templates yet. Add one above.
            </p>
          ) : (
            <>
              {/* Mobile / tablet: stacked cards */}
              <div className="space-y-3 lg:hidden">
                {templates.map((t) => {
                  const planned = effectiveMonthlyBudget(t)
                  const spent = spentByTemplateId[t.id] ?? 0
                  const left = planned - spent
                  const pct = budgetUtilizationPercent(spent, planned)
                  const hasPosting = (postedFinanceTxIdsByTemplateId[t.id]?.length ?? 0) > 0
                  const rowBusy = postingId === t.id || unpostingId === t.id
                  return (
                    <div
                      key={`m-${t.id}`}
                      className={`rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm ${
                        !t.isActive ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium leading-snug">{t.title}</span>
                          {!t.isActive && (
                            <span className="shrink-0 text-xs text-muted-foreground">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{getCategoryLabel(t.category)}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-muted-foreground">Planned</p>
                          <p className="mt-0.5 font-medium tabular-nums">{formatRs(planned)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Done</p>
                          <p className="mt-0.5 font-medium tabular-nums">{formatRs(spent)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Left</p>
                          <p
                            className={`mt-0.5 font-medium tabular-nums ${
                              left < 0 ? "text-destructive" : ""
                            }`}
                          >
                            {formatRs(left)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>Used</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${pct > 100 ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="mb-1 text-xs text-muted-foreground">Budget (Rs/mo)</p>
                        <BudgetCell
                          templateId={t.id}
                          initial={t.monthlyBudgetAmount != null ? String(t.monthlyBudgetAmount) : ""}
                          fallbackAmount={t.amount}
                          onSave={saveBudget}
                          saving={savingBudgetId === t.id}
                          layout="block"
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Books on day {t.dayOfMonth}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="h-10 w-full gap-1" asChild>
                          <Link href={`/finance/recurring/${t.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-10 w-full"
                          onClick={() => postOne(t.id)}
                          disabled={rowBusy || bulkLoading || !t.isActive}
                        >
                          {postingId === t.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Post month"
                          )}
                        </Button>
                      </div>
                      {hasPosting && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-10 w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => unpostMonth(t.id)}
                          disabled={rowBusy || bulkLoading}
                        >
                          {unpostingId === t.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Undo2 className="h-4 w-4" />
                              Remove posting
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-10 w-full text-destructive hover:text-destructive"
                        onClick={() => remove(t.id)}
                        disabled={rowBusy}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete template
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Desktop: full table */}
              <div className="hidden overflow-x-auto rounded-lg border border-border/60 lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Planned</TableHead>
                    <TableHead className="text-right">Executed</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Left</TableHead>
                    <TableHead className="min-w-[120px]">Used %</TableHead>
                    <TableHead className="text-right">Budget (Rs/mo)</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => {
                    const planned = effectiveMonthlyBudget(t)
                    const spent = spentByTemplateId[t.id] ?? 0
                    const left = planned - spent
                    const pct = budgetUtilizationPercent(spent, planned)
                    const hasPosting = (postedFinanceTxIdsByTemplateId[t.id]?.length ?? 0) > 0
                    const rowBusy = postingId === t.id || unpostingId === t.id
                    return (
                      <TableRow
                        key={t.id}
                        className={!t.isActive ? "opacity-60" : undefined}
                      >
                        <TableCell className="font-medium">
                          {t.title}
                          {!t.isActive && (
                            <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getCategoryLabel(t.category)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatRs(planned)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRs(spent)}</TableCell>
                        <TableCell
                          className={`hidden text-right tabular-nums lg:table-cell ${
                            left < 0 ? "text-destructive font-medium" : ""
                          }`}
                        >
                          {formatRs(left)}
                        </TableCell>
                        <TableCell>
                          <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${
                                pct > 100 ? "bg-destructive" : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </TableCell>
                        <TableCell>
                          <BudgetCell
                            templateId={t.id}
                            initial={
                              t.monthlyBudgetAmount != null ? String(t.monthlyBudgetAmount) : ""
                            }
                            fallbackAmount={t.amount}
                            onSave={saveBudget}
                            saving={savingBudgetId === t.id}
                            layout="inline"
                          />
                        </TableCell>
                        <TableCell>{t.dayOfMonth}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
                            <Button variant="outline" size="sm" className="h-8 gap-1 sm:h-9" asChild>
                              <Link href={`/finance/recurring/${t.id}`}>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 sm:h-9"
                              onClick={() => postOne(t.id)}
                              disabled={rowBusy || bulkLoading || !t.isActive}
                            >
                              {postingId === t.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Post month"
                              )}
                            </Button>
                            {hasPosting && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9"
                                onClick={() => unpostMonth(t.id)}
                                disabled={rowBusy || bulkLoading}
                              >
                                {unpostingId === t.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Undo2 className="h-3.5 w-3.5" />
                                    Remove posting
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 text-destructive hover:text-destructive sm:h-9"
                              onClick={() => remove(t.id)}
                              disabled={rowBusy}
                              aria-label="Delete template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BudgetCell({
  templateId,
  initial,
  fallbackAmount,
  onSave,
  saving,
  layout = "inline",
}: {
  templateId: string
  initial: string
  fallbackAmount: number
  onSave: (id: string, raw: string) => void
  saving: boolean
  layout?: "inline" | "block"
}) {
  const [val, setVal] = useState(initial)
  useEffect(() => {
    setVal(initial)
  }, [initial])

  const dirty = val !== initial

  if (layout === "block") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          className="h-10 min-w-0 flex-1 text-right text-sm tabular-nums sm:h-9"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder={String(fallbackAmount)}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={saving}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-10 w-full shrink-0 sm:h-9 sm:w-auto"
          disabled={!dirty || saving}
          onClick={() => onSave(templateId, val)}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save budget"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex max-w-[180px] items-center gap-1">
      <Input
        className="h-8 min-w-0 flex-1 text-right text-xs tabular-nums"
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        placeholder={String(fallbackAmount)}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={saving}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8 shrink-0 px-2 text-xs"
        disabled={!dirty || saving}
        onClick={() => onSave(templateId, val)}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
    </div>
  )
}
