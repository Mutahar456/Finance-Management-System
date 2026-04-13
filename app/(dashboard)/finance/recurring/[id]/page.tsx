import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { RecurringTemplateEditForm } from "@/components/finance/recurring-template-edit-form"

export const dynamic = "force-dynamic"

export default async function EditRecurringTemplatePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const role = session.user.role
  const userId = session.user.id

  const t = await prisma.recurringExpenseTemplate.findUnique({
    where: { id: params.id },
  })

  if (!t) notFound()
  if (role !== "ADMIN" && t.userId !== userId) {
    redirect("/finance/recurring")
  }

  const initial = {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    amount: Number(t.amount),
    monthlyBudgetAmount: t.monthlyBudgetAmount != null ? Number(t.monthlyBudgetAmount) : null,
    dayOfMonth: t.dayOfMonth,
    isActive: t.isActive,
    userId: t.userId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }

  return (
    <div className="mx-auto max-w-7xl 2xl:max-w-[1800px] px-1 py-2">
      <RecurringTemplateEditForm initial={initial} />
    </div>
  )
}
