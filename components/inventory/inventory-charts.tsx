"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type ChartItem = {
  category: string
  totalValue: number
  id: string
}

const PIE_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#64748b",
]

function aggregateByCategory(items: { category: string; totalValue: number }[]) {
  const map = new Map<string, { count: number; value: number; label: string }>()
  for (const it of items) {
    const key = it.category.trim().toLowerCase()
    const cur = map.get(key) || { count: 0, value: 0, label: it.category.trim() }
    cur.count += 1
    cur.value += it.totalValue
    map.set(key, cur)
  }
  return Array.from(map.values()).map((v) => ({
    name: v.label,
    count: v.count,
    value: v.value,
  }))
}

export function InventoryCharts({ items }: { items: ChartItem[] }) {
  const { pieData, barData } = useMemo(() => {
    const agg = aggregateByCategory(items)
    const pieData = agg.map((a) => ({ name: a.name, value: a.count }))
    const barData = agg
      .map((a) => ({ name: a.name, value: Math.round(a.value) }))
      .sort((a, b) => b.value - a.value)
    return { pieData, barData }
  }, [items])

  if (items.length === 0) {
    return (
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/50 shadow-lg shadow-black/20">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Category mix
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-[160px] items-center justify-center px-4 pb-4 text-xs text-muted-foreground sm:h-[220px] sm:text-sm">
            Add items to see distribution
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50 shadow-lg shadow-black/20">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Value by category
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-[160px] items-center justify-center px-4 pb-4 text-xs text-muted-foreground sm:h-[220px] sm:text-sm">
            Add items to see values
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      <Card className="border-border/60 bg-card/50 shadow-lg shadow-black/20 transition-shadow hover:shadow-xl hover:shadow-black/25">
        <CardHeader className="p-4 pb-1 sm:p-6 sm:pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight sm:text-base">
            Category distribution
          </CardTitle>
          <p className="text-[11px] text-muted-foreground sm:text-xs">Items per category</p>
        </CardHeader>
        <CardContent className="h-[200px] pt-0 sm:h-[248px]">
          {/* Fixed height parent so ResponsiveContainer resolves */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={80}
                paddingAngle={2}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-medium text-foreground">{payload[0].payload.name}</p>
                      <p className="text-muted-foreground">
                        {payload[0].value} items
                      </p>
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50 shadow-lg shadow-black/20 transition-shadow hover:shadow-xl hover:shadow-black/25">
        <CardHeader className="p-4 pb-1 sm:p-6 sm:pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight sm:text-base">
            Inventory value
          </CardTitle>
          <p className="text-[11px] text-muted-foreground sm:text-xs">Total value by category (Rs)</p>
        </CardHeader>
        <CardContent className="h-[200px] pt-0 sm:h-[248px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={56}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.15)" }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-medium">{payload[0].payload.name}</p>
                      <p className="text-muted-foreground">
                        Rs {Number(payload[0].value).toLocaleString()}
                      </p>
                    </div>
                  ) : null
                }
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                fill="url(#invBarGrad)"
                maxBarSize={48}
              />
              <defs>
                <linearGradient id="invBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.75} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
