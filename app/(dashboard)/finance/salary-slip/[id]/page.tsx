import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SalarySlipDocument } from "@/components/finance/salary-slip-document"
import { SalarySlipPrintToolbar } from "@/components/finance/salary-slip-print-toolbar"

export const dynamic = "force-dynamic"

export default async function SalarySlipPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const transaction = await prisma.financeTransaction.findUnique({
    where: { id: params.id },
  })

  if (!transaction) redirect("/finance")

  const role = session.user.role
  const userId = session.user.id
  if (role !== "ADMIN" && transaction.userId !== userId) redirect("/finance")

  const isSalaryExpense = transaction.type === "EXPENSE" && transaction.category === "salaries"
  if (!isSalaryExpense) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <h1 className="text-xl font-semibold">Salary slip</h1>
        <p className="text-sm text-muted-foreground">
          Printable slips use the company letterhead only for transactions with category{" "}
          <strong>Salaries</strong> (expense). Edit this entry or create a new expense with that category.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[220mm] px-3 py-6 print:max-w-none print:p-0">
      <SalarySlipPrintToolbar backHref={`/finance/${transaction.id}`} />
      <SalarySlipDocument
        employeeName={(transaction as { salaryEmployeeName?: string | null }).salaryEmployeeName ?? null}
        bankAccount={(transaction as { salaryBankAccount?: string | null }).salaryBankAccount ?? null}
        amount={Number(transaction.amount)}
        title={transaction.title}
        payDate={transaction.date}
        description={transaction.description}
      />
    </div>
  )
}
