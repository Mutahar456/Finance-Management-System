"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
// Local plain shape used by Finance page after serialization
interface FinanceRowTransaction {
  id: string
  title: string
  type: "INCOME" | "EXPENSE"
  amount: number
  date: string
  description?: string | null
  category?: string | null
  receiptUrl?: string | null
}
import { Button } from "@/components/ui/button"
import { exportToCSV } from "@/lib/export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
  Loader2,
  FileX,
} from "lucide-react"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getCategoryLabel, UNCATEGORIZED_VALUE } from "@/lib/finance-categories"

interface FinanceTableProps {
  transactions: FinanceRowTransaction[]
}

export function FinanceTable({ transactions: initialTransactions }: FinanceTableProps) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const t of transactions) {
      const raw = t.category?.trim()
      if (!raw) continue
      const k = raw.toLowerCase()
      if (!seen.has(k)) seen.set(k, raw)
    }
    return Array.from(seen.values()).sort((a, b) =>
      getCategoryLabel(a).localeCompare(getCategoryLabel(b))
    )
  }, [transactions])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    setLoading({ ...loading, [id]: true })

    try {
      const response = await fetch(`/api/finance/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== id))
      } else {
        alert("Failed to delete transaction")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      alert("An error occurred")
    } finally {
      setLoading({ ...loading, [id]: false })
    }
  }

  const filteredTransactions = useMemo(() => {
    const fromDate = from ? new Date(from) : null
    const toDate = to ? new Date(to) : null
    return transactions
      .filter((t) => (filter === "ALL" ? true : t.type === filter))
      .filter((t) => {
        if (!categoryFilter) return true
        const cur = t.category?.trim().toLowerCase() ?? ""
        return cur === categoryFilter.toLowerCase()
      })
      .filter((t) => (!fromDate || new Date(t.date) >= fromDate))
      .filter((t) => (!toDate || new Date(t.date) <= toDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions, filter, categoryFilter, from, to])

  const runningBalances = useMemo(() => {
    let bal = 0
    return filteredTransactions.map((t) => {
      bal += (t.type === 'INCOME' ? 1 : -1) * Number(t.amount)
      return bal
    })
  }, [filteredTransactions])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/20 p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:max-w-none">
          <div className="flex flex-wrap gap-2">
            {["ALL", "INCOME", "EXPENSE"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f as "ALL" | "INCOME" | "EXPENSE")}
                className={cn(
                  "min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f === "ALL" ? "All" : f === "INCOME" ? "Income" : "Expense"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="finance-category-filter"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Category
            </label>
            <select
              id="finance-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 min-w-[min(100%,240px)] flex-1 rounded-lg border border-input bg-background px-3 text-sm sm:flex-none sm:min-w-[240px]"
            >
              <option value="">All categories</option>
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value === UNCATEGORIZED_VALUE
                    ? "Uncategorized"
                    : getCategoryLabel(value)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="outline"
              className="h-10 flex-1 sm:flex-none"
              onClick={() => {
                const rows = filteredTransactions.map((t, idx) => ({
                  date: new Date(t.date).toLocaleDateString(),
                  title: t.title,
                  type: t.type,
                  Category: t.category ? getCategoryLabel(t.category) : "",
                  amount: (t.type === 'INCOME' ? 1 : -1) * Number(t.amount),
                  balance: runningBalances[idx],
                  receipt: (t as any).receiptUrl || ''
                }))
                exportToCSV(rows, `statement_${from || 'all'}_${to || 'all'}`)
              }}
            >
              Export CSV
            </Button>
            <a
              href={`/api/finance/statement?${from ? `from=${from}&` : ''}${to ? `to=${to}&` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <Button className="h-10 w-full">Export PDF</Button>
            </a>
          </div>
        </div>
      </div>

      {/* Desktop / tablet: data grid — use horizontal scroll instead of overflow-hidden (fixes wheel / trackpad) */}
      <div className="hidden md:block w-full max-w-full overflow-x-auto rounded-xl border border-border/80 shadow-sm">
        <Table className="min-w-[960px] text-[15px] [&_td]:align-middle">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {["Title", "Type", "Category", "Amount", "Date", "Description", "Receipt", "Balance", "Actions"].map((h) => (
                <TableHead
                  key={h}
                  className={cn(
                    "whitespace-nowrap text-sm font-semibold text-foreground",
                    h === "Category" && "min-w-[160px]",
                    h === "Title" && "min-w-[140px]",
                    h === "Description" && "min-w-[160px]"
                  )}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <FileX className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.25} />
                    <p className="text-base font-medium text-foreground">No transactions found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((t, i) => (
                <TableRow key={t.id} className="hover:bg-muted/40">
                  <TableCell className="max-w-[220px] font-medium leading-snug">{t.title}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                        t.type === "INCOME"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-500/15 text-red-700 dark:text-red-300"
                      )}
                    >
                      {t.type}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-[160px] px-3 py-3">
                    {t.category?.trim() ? (
                      <span
                        title={getCategoryLabel(t.category)}
                        className={cn(
                          "inline-block max-w-[220px] truncate rounded-lg border px-3 py-1.5 text-sm font-medium leading-tight",
                          t.type === "INCOME"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                            : "border-orange-500/45 bg-orange-500/15 text-orange-100 dark:text-orange-200"
                        )}
                      >
                        {getCategoryLabel(t.category)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-medium tabular-nums",
                      t.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    Rs {t.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-[15px] text-muted-foreground">
                    {t.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                      {t.receiptUrl ? (
                        <a
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          href={t.receiptUrl as string}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          View
                        </a>
                      ) : (
                        <a
                          className="inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:underline"
                          href={`/api/finance/${t.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          {t.type === "EXPENSE" && t.category === "salaries"
                            ? "Salary slip (PDF)"
                            : "Invoice PDF"}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">
                    Rs {runningBalances[i].toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1 px-2"
                        title="Edit transaction"
                        onClick={() => router.push(`/finance/${t.id}?edit=true`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden xl:inline">Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="Delete transaction"
                        onClick={() => handleDelete(t.id)}
                        disabled={loading[t.id]}
                      >
                        {loading[t.id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden xl:inline">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
            <FileX className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.25} />
            <p className="font-medium text-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          filteredTransactions.map((transaction, idx) => (
            <div key={transaction.id} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{transaction.title}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    transaction.type === "INCOME"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {transaction.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Category</span>
                {transaction.category?.trim() ? (
                  <span
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-sm font-medium leading-tight",
                      transaction.type === "INCOME"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        : "border-orange-500/40 bg-orange-500/12 text-orange-900 dark:text-orange-200"
                    )}
                  >
                    {getCategoryLabel(transaction.category)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p
                    className={`text-xl font-bold ${
                      transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(runningBalances[idx])}</p>
                </div>
              </div>
              {transaction.description && (
                <p className="text-sm text-muted-foreground">{transaction.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                {transaction.receiptUrl ? (
                  <a
                    className="text-primary hover:underline"
                    href={transaction.receiptUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View receipt
                  </a>
                ) : (
                  <a
                    className="inline-flex items-center gap-1 font-medium text-orange-500 hover:underline"
                    href={`/api/finance/${transaction.id}/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    {transaction.type === "EXPENSE" && transaction.category === "salaries"
                      ? "Salary slip (PDF)"
                      : "Download invoice (PDF)"}
                  </a>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/finance/${transaction.id}?edit=true`)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(transaction.id)}
                  disabled={loading[transaction.id]}
                >
                  {loading[transaction.id] ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

