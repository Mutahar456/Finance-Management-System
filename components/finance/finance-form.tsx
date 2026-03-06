"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FinanceTransaction } from "@/types"

const financeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
})

type FinanceFormData = z.infer<typeof financeSchema>

interface FinanceFormProps {
  transaction?: FinanceTransaction
  defaultType?: "INCOME" | "EXPENSE"
  onSuccess?: () => void
}

export function FinanceForm({ transaction, defaultType, onSuccess }: FinanceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(transaction?.receiptUrl || null)

  // Get today's date in YYYY-MM-DD format for default value
  const todayDate = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FinanceFormData>({
    resolver: zodResolver(financeSchema),
    defaultValues: transaction
      ? {
          title: transaction.title,
          type: transaction.type as "INCOME" | "EXPENSE",
          amount: transaction.amount.toString(),
          date: new Date(transaction.date).toISOString().split("T")[0],
          description: transaction.description || "",
        }
      : {
          type: defaultType || "EXPENSE",
          date: todayDate, // Set default date to today
        },
  })

  const type = watch("type")

  const onSubmit = async (data: FinanceFormData) => {
    setLoading(true)
    setError("")

    try {
      let receiptUrl = data.receiptUrl || transaction?.receiptUrl || ""
      if (file) {
        const form = new FormData()
        form.append('file', file)
        const up = await fetch('/api/uploads/image', { method: 'POST', body: form })
        
        // Check if response is JSON before parsing
        const contentType = up.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await up.text()
          console.error('Server returned non-JSON response:', text.substring(0, 200))
          throw new Error('Server error: Invalid response format')
        }
        
        const uj = await up.json()
        if (!up.ok) {
          const errorMsg = uj.details || uj.error || 'Receipt upload failed'
          throw new Error(errorMsg)
        }
        receiptUrl = uj.url
      }

      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        receiptUrl,
      }

      const url = transaction ? `/api/finance/${transaction.id}` : "/api/finance"
      const method = transaction ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save transaction")
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/finance")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <select
            id="type"
            {...register("type")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Enter transaction title"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (Rs) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register("amount")}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            {...register("date")}
            className="w-full cursor-pointer"
            style={{
              colorScheme: 'light dark',
            }}
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2 2xl:col-span-3">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register("description")}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Optional description"
          />
        </div>
        <div className="space-y-2 md:col-span-2 2xl:col-span-3">
          <Label htmlFor="receipt">Receipt/Evidence (optional)</Label>
          <input id="receipt" type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0] || null
            setFile(f)
            if (f) setPreview(URL.createObjectURL(f))
          }} className="block w-full rounded-md border border-input bg-background p-2 text-sm" />
          {preview && <img src={preview} alt="receipt" className="mt-2 h-24 w-24 rounded object-cover" />}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : transaction ? "Update Transaction" : "Create Transaction"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}


