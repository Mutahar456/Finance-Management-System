import { Prisma } from "@prisma/client"

/** True when `prisma generate` never completed after adding `monthlyBudgetAmount` (common on Windows EPERM). */
export function isStaleClientMissingMonthlyBudget(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientValidationError &&
    e.message.includes("monthlyBudgetAmount")
  )
}

export const STALE_PRISMA_CLIENT_HINT =
  "Prisma Client is outdated: stop npm run dev, run npx prisma generate, then start dev again (Windows: close dev first to avoid EPERM)."
