import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect('/login')

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true, project: true } })
  if (!invoice) redirect('/projects')

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{invoice.project.name} · {invoice.clientName}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/invoices/${params.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">Export PDF</Button>
          </a>
          <a href={`/invoices/${params.id}/edit`} className="flex-1 sm:flex-none">
            <Button className="w-full">Edit</Button>
          </a>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Client</div>
              <div className="font-medium">{invoice.clientName}</div>
              <div className="text-sm">{invoice.clientEmail}</div>
              <div className="text-sm whitespace-pre-line">{invoice.clientAddress}</div>
            </div>
            <div className="md:text-right">
              <div className="text-sm text-muted-foreground">Dates</div>
              <div>Issue: {new Date(invoice.issueDate as any).toLocaleDateString()}</div>
              <div>Due: {invoice.dueDate ? new Date(invoice.dueDate as any).toLocaleDateString() : '-'}</div>
              <div>Status: <span className="rounded bg-muted px-2 py-0.5 text-xs">{invoice.status}</span></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Description</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map(it => (
                  <tr key={it.id} className="border-b">
                    <td className="p-2">{it.description}</td>
                    <td className="p-2">{it.quantity}</td>
                    <td className="p-2">{invoice.currency} {Number(it.unitPrice).toFixed(2)}</td>
                    <td className="p-2">{invoice.currency} {Number(it.lineTotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-right space-y-1">
            <div>Subtotal: {invoice.currency} {Number(invoice.subtotal).toFixed(2)}</div>
            <div>Tax: {invoice.currency} {Number(invoice.taxAmount).toFixed(2)}</div>
            <div className="text-lg md:text-xl font-semibold">Total: {invoice.currency} {Number(invoice.total).toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


