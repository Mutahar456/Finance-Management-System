import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProjectInvoicesPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect("/login")

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) redirect("/projects")

  const invoices = await prisma.invoice.findMany({ where: { projectId: params.id }, orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices · {project.name}</h1>
          <p className="text-muted-foreground">Create and manage project invoices</p>
        </div>
        <Link href={`/projects/${params.id}/invoices/new`}><Button>New Invoice</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Number</th>
                  <th className="p-2">Client</th>
                  <th className="p-2">Issue Date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td className="p-4 text-center text-muted-foreground" colSpan={6}>No invoices yet</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className="border-b">
                    <td className="p-2 font-medium">{inv.invoiceNumber}</td>
                    <td className="p-2">{inv.clientName}</td>
                    <td className="p-2">{new Date(inv.issueDate as any).toLocaleDateString()}</td>
                    <td className="p-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{inv.status}</span></td>
                    <td className="p-2">{inv.currency} {Number(inv.total).toLocaleString()}</td>
                    <td className="p-2 space-x-2">
                      <Link href={`/invoices/${inv.id}`} className="text-primary hover:underline">Open</Link>
                      <Link href={`/invoices/${inv.id}/edit`} className="text-muted-foreground hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


