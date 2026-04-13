import { z } from "zod"
import { isAllowedCategory } from "@/lib/finance-categories"

export const financeBodySchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.number().positive("Amount must be positive"),
    date: z.string(),
    description: z.string().optional().nullable(),
    receiptUrl: z.string().optional().nullable(),
    category: z.string().trim().min(1, "Category is required"),
    salaryEmployeeName: z.string().optional().nullable(),
    salaryBankAccount: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!isAllowedCategory(data.type, data.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid category for this transaction type",
        path: ["category"],
      })
    }
  })
