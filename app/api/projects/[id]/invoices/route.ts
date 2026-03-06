import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createActivityLog } from "@/actions/activity-log"
import { ActionType, Module } from "@prisma/client"

const createSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  currency: z.string().default("PKR"),
  taxRate: z.number().min(0).max(99.99).default(0),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  items: z.array(z.object({ description: z.string().min(1), quantity: z.number().int().min(1).default(1), unitPrice: z.number().min(0) })).min(1),
  notes: z.string().optional(),
  terms: z.string().optional(),
})

function calcTotals(items: { quantity: number, unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2))
  const total = Number((subtotal + taxAmount).toFixed(2))
  return { subtotal, taxAmount, total }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const invoices = await prisma.invoice.findMany({ where: { projectId: params.id }, orderBy: { createdAt: "desc" } })
    return NextResponse.json(invoices)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const data = createSchema.parse({
      ...body,
      taxRate: body.taxRate ? Number(body.taxRate) : 0,
      items: (body.items || []).map((i: any) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
    })

    // next invoice number simple scheme INV-YYYY-####
    const year = new Date().getFullYear()
    const count = await prisma.invoice.count({ where: { invoiceNumber: { startsWith: `INV-${year}-` } } })
    const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`

    const totals = calcTotals(data.items, data.taxRate)

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
        projectId: params.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientAddress: data.clientAddress || null,
        issueDate: new Date(data.issueDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        currency: data.currency,
        taxRate: data.taxRate,
        status: "DRAFT",
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes: data.notes || null,
        terms: data.terms || null,
        createdBy: session.user!.id,
        items: {
          create: data.items.map((it) => ({ description: it.description, quantity: it.quantity, unitPrice: it.unitPrice, lineTotal: it.quantity * it.unitPrice }))
        }
      },
    })

    await createActivityLog({ actionType: ActionType.CREATE, module: Module.PROJECTS, recordId: created.id, performedBy: session.user!.id, newValues: created, description: `Created invoice ${invoiceNumber}` })

    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: e.errors?.[0]?.message || 'Invalid input' }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


