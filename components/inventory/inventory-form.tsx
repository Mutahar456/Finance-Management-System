"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InventoryItem } from "@/types"

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  supplier: z.string().min(1, "Supplier is required"),
  unitPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  imageUrl: z.string().optional().or(z.literal("")),
})

type InventoryFormData = z.infer<typeof inventorySchema>

interface InventoryFormProps {
  item?: InventoryItem
  onSuccess?: () => void
}

export function InventoryForm({ item, onSuccess }: InventoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(item?.imageUrl || null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: item
      ? {
          name: item.name,
          category: item.category,
          quantity: item.quantity.toString(),
          purchaseDate: new Date(item.purchaseDate).toISOString().split("T")[0],
          supplier: item.supplier,
          unitPrice: item.unitPrice.toString(),
          imageUrl: item.imageUrl || "",
        }
      : undefined,
  })

  const onSubmit = async (data: InventoryFormData) => {
    setLoading(true)
    setError("")

    try {
      let imageUrl = data.imageUrl || ""
      if (file) {
        const form = new FormData()
        form.append('file', file)
        const up = await fetch('/api/uploads/image', { method: 'POST', body: form })
        const uj = await up.json()
        if (!up.ok) throw new Error(uj.error || 'Image upload failed')
        imageUrl = uj.url
      }

      const payload = {
        ...data,
        imageUrl,
        quantity: parseInt(data.quantity),
        unitPrice: parseFloat(data.unitPrice),
      }

      const url = item ? `/api/inventory/${item.id}` : "/api/inventory"
      const method = item ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save item")
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/inventory")
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter item name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            {...register("category")}
            placeholder="e.g., Electronics, Furniture"
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            {...register("quantity")}
            placeholder="0"
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price (Rs) *</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            {...register("unitPrice")}
            placeholder="0.00"
          />
          {errors.unitPrice && (
            <p className="text-sm text-destructive">{errors.unitPrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier *</Label>
          <Input
            id="supplier"
            {...register("supplier")}
            placeholder="Enter supplier name"
          />
          {errors.supplier && (
            <p className="text-sm text-destructive">{errors.supplier.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date *</Label>
          <Input
            id="purchaseDate"
            type="date"
            {...register("purchaseDate")}
          />
          {errors.purchaseDate && (
            <p className="text-sm text-destructive">{errors.purchaseDate.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="image">Image (Optional)</Label>
          <input id="image" type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0] || null
            setFile(f)
            if (f) {
              const url = URL.createObjectURL(f)
              setPreview(url)
            }
          }} className="block w-full rounded-md border border-input bg-background p-2 text-sm" />
          {preview && (
            <img src={preview} alt="preview" className="mt-2 h-24 w-24 rounded object-cover" />
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : item ? "Update Item" : "Create Item"}
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


