/** Shared income/expense category values for forms, API validation, and display labels */

export const UNCATEGORIZED_VALUE = "uncategorized"

export const EXPENSE_CATEGORIES = [
  { value: UNCATEGORIZED_VALUE, label: "Uncategorized" },
  { value: "office_rent", label: "Office Rent" },
  { value: "salaries", label: "Salaries" },
  { value: "software_tools", label: "Software & Tools" },
  { value: "hardware", label: "Hardware & Equipment" },
  { value: "marketing", label: "Marketing" },
  { value: "utilities", label: "Utilities" },
  { value: "travel", label: "Travel" },
  { value: "freelancer_payment", label: "Freelancer Payment" },
  { value: "bank_charges", label: "Bank Charges" },
  { value: "other", label: "Other" },
] as const

export const INCOME_CATEGORIES = [
  { value: UNCATEGORIZED_VALUE, label: "Uncategorized" },
  { value: "project_payment", label: "Project Payment" },
  { value: "fiverr", label: "Fiverr" },
  { value: "upwork", label: "Upwork" },
  { value: "direct_client", label: "Direct Client" },
  { value: "retainer", label: "Retainer" },
  { value: "investment", label: "Investment Return" },
  { value: "other", label: "Other" },
] as const

const EXPENSE_VALUES = new Set<string>(EXPENSE_CATEGORIES.map((c) => c.value))
const INCOME_VALUES = new Set<string>(INCOME_CATEGORIES.map((c) => c.value))

export function categoriesForType(type: "INCOME" | "EXPENSE") {
  return type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
}

export function isAllowedCategory(type: "INCOME" | "EXPENSE", value: string) {
  return type === "EXPENSE" ? EXPENSE_VALUES.has(value) : INCOME_VALUES.has(value)
}

export function getCategoryLabel(value: string): string {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  const found = all.find((c) => c.value === value)
  if (found) return found.label
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}
