"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type ChartTransaction = {
  id: string
  title: string
  type: "INCOME" | "EXPENSE"
  amount: number
  date: string
  description?: string | null
  receiptUrl?: string | null
}

export type Props = { transactions: ChartTransaction[] }

function formatRs(n: number) {
  return `Rs ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

/** YYYY-MM in local time — avoids UTC shift vs toISOString() month buckets */
function localYearMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function yearMonthFromTransactionDate(iso: string) {
  return localYearMonth(new Date(iso))
}

const INCOME_BAR = "#22c55e"
const EXPENSE_BAR = "#f97316"

export function FinanceCharts({ transactions }: Props) {
  const monthlyData = useMemo(() => {
    type MonthBucket = { month: string; income: number; expense: number }
    const months: Record<string, MonthBucket> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = localYearMonth(d)
      months[key] = {
        month: d.toLocaleString("default", { month: "short" }),
        income: 0,
        expense: 0,
      }
    }
    transactions.forEach((t) => {
      const key = yearMonthFromTransactionDate(t.date)
      if (months[key]) {
        if (t.type === "INCOME") months[key].income += t.amount
        else months[key].expense += t.amount
      }
    })
    return Object.values(months)
  }, [transactions])

  const balanceData = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    start.setHours(0, 0, 0, 0)

    const inWindow = transactions
      .filter((t) => {
        const dt = new Date(t.date)
        return dt >= start
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const byDay = new Map<string, number>()
    for (const t of inWindow) {
      const day = t.date.slice(0, 10)
      const delta = t.type === "INCOME" ? t.amount : -t.amount
      byDay.set(day, (byDay.get(day) || 0) + delta)
    }

    const points: { label: string; balance: number }[] = []
    let cumulative = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const dayStr = d.toISOString().slice(0, 10)
      cumulative += byDay.get(dayStr) || 0
      points.push({
        label: d.toLocaleString("default", { month: "short", day: "numeric" }),
        balance: cumulative,
      })
    }
    return points
  }, [transactions])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="border-border/80 shadow-sm lg:col-span-2">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-lg font-semibold">Income vs expenses</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Each month: <span className="text-emerald-500">green</span> = income total,{" "}
            <span className="text-orange-500">orange</span> = expense total (all-time data in range).
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
                        <p className="mb-1 font-medium text-foreground">{label}</p>
                        {payload.map((p) => (
                          <p key={String(p.dataKey)} className="text-muted-foreground">
                            <span className="capitalize">{String(p.name)}: </span>
                            {formatRs(Number(p.value))}
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Bar dataKey="income" name="income" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={`inc-${i}`} fill={INCOME_BAR} />
                  ))}
                </Bar>
                <Bar dataKey="expense" name="expense" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={`exp-${i}`} fill={EXPENSE_BAR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm lg:col-span-1">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-lg font-semibold">30-day movement</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Cumulative effect of each day&apos;s income minus expenses (last 30 days).
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashFlowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={{ stroke: "transparent", fill: "hsl(var(--muted) / 0.08)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0]
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
                        <p className="font-medium text-foreground">{p.payload.label}</p>
                        <p className="text-muted-foreground">{formatRs(Number(p.value))}</p>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#cashFlowFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
