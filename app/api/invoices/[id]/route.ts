import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"

const updateSchema = z.object({
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional().nullable(),
  clientAddress: z.string().optional().nullable(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  currency: z.string().optional(),
  taxRate: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  items: z.array(z.object({ id: z.string().optional(), description: z.string(), quantity: z.number(), unitPrice: z.number() })).optional(),
})

function calcTotals(items: { quantity: number, unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const taxAmount = Number(((subtotal * (taxRate || 0)) / 100).toFixed(2))
  const total = Number((subtotal + taxAmount).toFixed(2))
  return { subtotal, taxAmount, total }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const invoice = await prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true, project: true } })
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(invoice)
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const existing = await prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const data = updateSchema.parse(body)

    let items = existing.items.map(i => ({ id: i.id, description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) }))
    if (data.items) items = data.items.map(i => ({ id: i.id as string, description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) }))
    const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : Number(existing.taxRate)
    const totals = calcTotals(items, taxRate)

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        clientName: data.clientName ?? existing.clientName,
        clientEmail: data.clientEmail ?? existing.clientEmail,
        clientAddress: data.clientAddress ?? existing.clientAddress,
        issueDate: data.issueDate ? new Date(data.issueDate) : existing.issueDate,
        dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
        currency: data.currency ?? existing.currency,
        taxRate,
        status: data.status ?? existing.status,
        notes: data.notes ?? existing.notes,
        terms: data.terms ?? existing.terms,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: data.items ? {
          deleteMany: { invoiceId: params.id },
          create: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.quantity * i.unitPrice }))
        } : undefined,
      },
      include: { items: true },
    })

    await createActivityLog({ actionType: ActionType.UPDATE, module: Module.PROJECTS, recordId: updated.id, performedBy: session.user!.id, oldValues: existing, newValues: updated, description: `Updated invoice ${updated.invoiceNumber}` })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: e.errors?.[0]?.message || 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const existing = await prisma.invoice.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.invoice.delete({ where: { id: params.id } })
    await createActivityLog({ actionType: ActionType.DELETE, module: Module.PROJECTS, recordId: params.id, performedBy: session.user!.id, oldValues: existing, description: `Deleted invoice ${existing.invoiceNumber}` })
    return NextResponse.json({ message: "Deleted" })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


