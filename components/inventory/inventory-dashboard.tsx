"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  AlertTriangle,
  Armchair,
  Edit,
  Eye,
  Keyboard,
  Package,
  Search,
  ShoppingBasket,
  Sparkles,
  StickyNote,
  Trash2,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InventoryCharts } from "@/components/inventory/inventory-charts"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

export interface InventoryRowItem {
  id: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalValue: number
  supplier: string
  purchaseDate: string
  imageUrl: string | null
  user: { id: string; name: string }
}

interface InventoryDashboardProps {
  items: InventoryRowItem[]
  categories: string[]
}

const LOW_STOCK_MAX = 5

const CATEGORY_BADGE_STYLES: { pattern: RegExp; className: string }[] = [
  { pattern: /electronic/i, className: "bg-sky-500/12 text-sky-300 border-sky-500/25" },
  { pattern: /furniture/i, className: "bg-amber-500/12 text-amber-300 border-amber-500/25" },
  { pattern: /safai|clean/i, className: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25" },
  { pattern: /station/i, className: "bg-violet-500/12 text-violet-300 border-violet-500/25" },
  { pattern: /grocer/i, className: "bg-rose-500/12 text-rose-300 border-rose-500/25" },
]

function categoryBadgeClass(category: string) {
  for (const { pattern, className } of CATEGORY_BADGE_STYLES) {
    if (pattern.test(category)) return className
  }
  let h = 0
  for (let i = 0; i < category.length; i++) h = (h + category.charCodeAt(i) * (i + 1)) % 360
  const hue = h
  return `border-white/10 bg-[hsla(${hue},45%,22%,0.45)] text-[hsla(${hue},70%,82%,1)]`
}

/** Icon tile when no product image — matches category tint */
function categoryIconSurfaceClass(category: string) {
  for (const { pattern, className } of CATEGORY_BADGE_STYLES) {
    if (pattern.test(category)) {
      return cn(
        "border-transparent",
        className.replace(/border-\S+/g, "border-transparent")
      )
    }
  }
  let hue = 0
  for (let i = 0; i < category.length; i++) {
    hue = (hue + category.charCodeAt(i) * (i + 1)) % 360
  }
  return `border-transparent bg-[hsla(${hue},40%,18%,0.55)] text-[hsla(${hue},65%,78%,1)]`
}

function ItemCategoryIcon({ category }: { category: string }) {
  const c = category.toLowerCase()
  const cls = "h-4 w-4 shrink-0"
  if (/electronic|keyboard|computer|tech/i.test(c)) return <Keyboard className={cls} />
  if (/furniture|chair|desk|matte/i.test(c)) return <Armchair className={cls} />
  if (/safai|clean|dust|mop|tissue|fresh/i.test(c)) return <Sparkles className={cls} />
  if (/station|note|card|pen/i.test(c)) return <StickyNote className={cls} />
  if (/grocer|food/i.test(c)) return <ShoppingBasket className={cls} />
  return <Package className={cls} />
}

function stockStatus(quantity: number): {
  label: string
  variant: "in" | "low" | "out"
} {
  if (quantity <= 0) return { label: "Out of Stock", variant: "out" }
  if (quantity <= LOW_STOCK_MAX) return { label: "Low Stock", variant: "low" }
  return { label: "In Stock", variant: "in" }
}

function stockBadgeClass(variant: "in" | "low" | "out") {
  switch (variant) {
    case "out":
      return "bg-destructive/15 text-destructive border-destructive/25"
    case "low":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    default:
      return "bg-emerald-500/12 text-emerald-400 border-emerald-500/25"
  }
}

export function InventoryDashboard({ items: initialItems, categories }: InventoryDashboardProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const stats = useMemo(() => {
    const totalValue = items.reduce((s, i) => s + i.totalValue, 0)
    const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= LOW_STOCK_MAX).length
    return {
      totalValue,
      totalItems: items.length,
      lowStock,
    }
  }, [items])

  const chartItems = useMemo(
    () => items.map((i) => ({ id: i.id, category: i.category, totalValue: i.totalValue })),
    [items]
  )

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      const matchesCategory =
        !selectedCategory ||
        item.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      return matchesSearch && matchesCategory
    })
  }, [items, search, selectedCategory])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    setLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        alert("Failed to delete item")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("An error occurred")
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const unoptimized = (url: string) =>
    url.includes("cloudinary.com") || url.startsWith("http://")

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
        <Card className="border-border/60 bg-card/60 shadow-lg shadow-black/15 transition-all duration-200 hover:border-border hover:shadow-xl hover:shadow-black/20">
          <CardContent className="flex items-start gap-2 p-3 sm:gap-4 sm:p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20 sm:h-11 sm:w-11 sm:rounded-xl">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 space-y-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">
                Total value
              </p>
              <p className="text-sm font-semibold leading-tight tracking-tight tabular-nums sm:text-2xl">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 shadow-lg shadow-black/15 transition-all duration-200 hover:border-border hover:shadow-xl hover:shadow-black/20">
          <CardContent className="flex items-start gap-2 p-3 sm:gap-4 sm:p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/12 text-sky-400 ring-1 ring-sky-500/20 sm:h-11 sm:w-11 sm:rounded-xl">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 space-y-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">
                Total items
              </p>
              <p className="text-sm font-semibold leading-tight tracking-tight tabular-nums sm:text-2xl">
                {stats.totalItems}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 bg-card/60 shadow-lg shadow-black/15 transition-all duration-200 hover:border-border hover:shadow-xl hover:shadow-black/20 sm:col-span-1">
          <CardContent className="flex items-start gap-2 p-3 sm:gap-4 sm:p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/25 sm:h-11 sm:w-11 sm:rounded-xl">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 space-y-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">
                Low stock
              </p>
              <p className="text-sm font-semibold leading-tight tracking-tight tabular-nums text-amber-400/95 sm:text-2xl">
                {stats.lowStock}
              </p>
              <p className="text-[10px] text-muted-foreground sm:text-[11px]">Qty 1–{LOW_STOCK_MAX}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <InventoryCharts items={chartItems} />

      <Card className="border-border/60 bg-card/50 shadow-lg shadow-black/20">
        <CardHeader className="space-y-3 p-4 pb-3 sm:space-y-4 sm:p-6 sm:pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">Inventory items</CardTitle>
              <p className="text-xs text-muted-foreground sm:text-sm">
                <span className="sm:hidden">Search &amp; filter · stock status by qty.</span>
                <span className="hidden sm:inline">Search and filter in real time. Stock status reflects quantity thresholds.</span>
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
            <Input
              placeholder="Search name, supplier, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg border-border/80 bg-background/50 pl-9 text-sm shadow-sm transition-colors focus-visible:ring-primary/30 sm:h-11 sm:rounded-xl sm:pl-10"
            />
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter by category"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === ""}
              onClick={() => setSelectedCategory("")}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                selectedCategory === ""
                  ? "border-primary/50 bg-primary/15 text-primary shadow-sm"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  selectedCategory === cat
                    ? "border-primary/50 bg-primary/15 text-primary shadow-sm"
                    : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="hidden md:block overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[72px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Item
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Stock
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Unit price
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total value
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Supplier
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Purchase date
                  </TableHead>
                  <TableHead className="w-[132px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-28 text-center text-sm text-muted-foreground"
                    >
                      No items match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const st = stockStatus(item.quantity)
                    return (
                      <TableRow
                        key={item.id}
                        className="group border-border/50 transition-colors duration-150 hover:bg-muted/25"
                      >
                        <TableCell className="py-3">
                          {item.imageUrl ? (
                            <div className="relative h-11 w-11 overflow-hidden rounded-lg ring-1 ring-border/60 transition-transform duration-200 group-hover:ring-border">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="44px"
                                unoptimized={unoptimized(item.imageUrl)}
                              />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-lg ring-1 ring-border/50 transition-transform duration-200 group-hover:scale-[1.02]",
                                categoryIconSurfaceClass(item.category)
                              )}
                            >
                              <ItemCategoryIcon category={item.category} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-medium text-foreground">{item.name}</span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                              categoryBadgeClass(item.category)
                            )}
                          >
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                              stockBadgeClass(st.variant)
                            )}
                          >
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 tabular-nums text-muted-foreground">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="py-3 font-medium tabular-nums">
                          {formatCurrency(item.totalValue)}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">{item.supplier}</TableCell>
                        <TableCell className="py-3 text-muted-foreground tabular-nums">
                          {formatDate(item.purchaseDate)}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex justify-end gap-0.5 opacity-90 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => router.push(`/inventory/${item.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => router.push(`/inventory/${item.id}?edit=true`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(item.id)}
                              disabled={loading[item.id]}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3 pt-2">
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
                No items match your filters
              </div>
            ) : (
              filteredItems.map((item) => {
                const st = stockStatus(item.quantity)
                return (
                  <div
                    key={item.id}
                    className="group rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm transition-all duration-200 hover:border-border hover:bg-muted/20"
                  >
                    <div className="flex gap-3">
                      {item.imageUrl ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/50">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized={unoptimized(item.imageUrl)}
                          />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ring-1 ring-border/50",
                            categoryIconSurfaceClass(item.category)
                          )}
                        >
                          <ItemCategoryIcon category={item.category} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-tight">{item.name}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium",
                              categoryBadgeClass(item.category)
                            )}
                          >
                            {item.category}
                          </span>
                          <span
                            className={cn(
                              "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium",
                              stockBadgeClass(st.variant)
                            )}
                          >
                            {st.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Supplier · {item.supplier}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Unit price
                        </p>
                        <p className="font-medium tabular-nums">{formatCurrency(item.unitPrice)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Total value
                        </p>
                        <p className="font-semibold tabular-nums">{formatCurrency(item.totalValue)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Purchase date
                        </p>
                        <p className="tabular-nums text-muted-foreground">
                          {formatDate(item.purchaseDate)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-border/50 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg"
                        onClick={() => router.push(`/inventory/${item.id}`)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg"
                        onClick={() => router.push(`/inventory/${item.id}?edit=true`)}
                      >
                        <Edit className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => handleDelete(item.id)}
                        disabled={loading[item.id]}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
