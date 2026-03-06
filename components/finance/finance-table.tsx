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
  receiptUrl?: string | null
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { exportToCSV } from "@/lib/export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2, Plus } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface FinanceTableProps {
  transactions: FinanceRowTransaction[]
}

export function FinanceTable({ transactions: initialTransactions }: FinanceTableProps) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [loading, setLoading] = useState<Record<string, boolean>>({})

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
      .filter((t) => (!fromDate || new Date(t.date) >= fromDate))
      .filter((t) => (!toDate || new Date(t.date) <= toDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions, filter, from, to])

  const runningBalances = useMemo(() => {
    let bal = 0
    return filteredTransactions.map((t) => {
      bal += (t.type === 'INCOME' ? 1 : -1) * Number(t.amount)
      return bal
    })
  }, [filteredTransactions])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-md px-3 py-1 text-sm ${
              filter === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("INCOME")}
            className={`rounded-md px-3 py-1 text-sm ${
              filter === "INCOME"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setFilter("EXPENSE")}
            className={`rounded-md px-3 py-1 text-sm ${
              filter === "EXPENSE"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Expense
          </button>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Input 
            type="date" 
            value={from} 
            onChange={(e) => setFrom(e.target.value)} 
            placeholder="From date"
            className="flex-1 sm:flex-none w-auto min-w-[150px]" 
          />
          <Input 
            type="date" 
            value={to} 
            onChange={(e) => setTo(e.target.value)} 
            placeholder="To date"
            className="flex-1 sm:flex-none w-auto min-w-[150px]" 
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => {
            const rows = filteredTransactions.map((t, idx) => ({
              date: new Date(t.date).toLocaleDateString(),
              title: t.title,
              type: t.type,
              amount: (t.type === 'INCOME' ? 1 : -1) * Number(t.amount),
              balance: runningBalances[idx],
              receipt: (t as any).receiptUrl || ''
            }))
            exportToCSV(rows, `statement_${from || 'all'}_${to || 'all'}`)
          }}>Export CSV</Button>
          <a href={`/api/finance/statement?${from ? `from=${from}&` : ''}${to ? `to=${to}&` : ''}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
            <Button className="w-full">Export PDF</Button>
          </a>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction, idx) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.title}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        transaction.type === "INCOME"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`font-medium ${
                      transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.description || "-"}
                  </TableCell>
                  <TableCell>
                    {transaction.receiptUrl ? (
                      <a className="text-primary hover:underline" href={transaction.receiptUrl as any} target="_blank">View</a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{formatCurrency(runningBalances[idx])}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/finance/${transaction.id}?edit=true`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                        disabled={loading[transaction.id]}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
          <div className="text-center text-muted-foreground py-8">
            No transactions found
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
              {transaction.receiptUrl && (
                <a className="text-sm text-primary hover:underline" href={transaction.receiptUrl as any} target="_blank">View Receipt</a>
              )}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/finance/${transaction.id}?edit=true`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(transaction.id)}
                  disabled={loading[transaction.id]}
                >
                  <Trash2 className="h-4 w-4 mr-1 text-destructive" />
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


