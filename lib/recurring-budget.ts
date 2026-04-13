/** Planned monthly allocation for budget UI — explicit cap or default bill amount. */
export function effectiveMonthlyBudget(t: {
  amount: unknown
  monthlyBudgetAmount: unknown
}): number {
  const cap =
    t.monthlyBudgetAmount != null ? Number(t.monthlyBudgetAmount) : null
  if (cap != null && !Number.isNaN(cap) && cap > 0) return cap
  return Number(t.amount)
}

export function budgetUtilizationPercent(spent: number, budget: number): number {
  if (budget <= 0) return spent > 0 ? 100 : 0
  return Math.min(100, Math.round((spent / budget) * 1000) / 10)
}
