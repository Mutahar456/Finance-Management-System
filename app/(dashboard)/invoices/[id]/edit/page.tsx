"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [invoice, setInvoice] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        setInvoice({
          clientName: data.clientName || '',
          clientEmail: data.clientEmail || '',
          clientAddress: data.clientAddress || '',
          issueDate: data.issueDate ? new Date(data.issueDate).toISOString().slice(0,10) : '',
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0,10) : '',
          currency: data.currency || 'PKR',
          taxRate: String(data.taxRate || 0),
          projectId: data.projectId,
        })
        setItems((data.items || []).map((i: any) => ({ id: i.id, description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })))
      } catch (e: any) {
        setError(e.message || 'Error loading invoice')
      } finally {
        setLoading(false)
      }
    })()
  }, [params.id])

  const addRow = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  const removeRow = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const setRow = (i: number, key: string, value: any) => setItems(items.map((r, idx) => idx === i ? { ...r, [key]: value } : r))

  const save = async () => {
    if (!invoice) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          clientAddress: invoice.clientAddress,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          currency: invoice.currency,
          taxRate: Number(invoice.taxRate || 0),
          items,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push(`/invoices/${params.id}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!invoice) return <div className="p-6">{error || 'Not found'}</div>

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const taxAmount = (subtotal * Number(invoice.taxRate || 0)) / 100
  const total = subtotal + taxAmount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Invoice</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input value={invoice.clientName} onChange={(e) => setInvoice({ ...invoice, clientName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Client Email</Label>
            <Input value={invoice.clientEmail} onChange={(e) => setInvoice({ ...invoice, clientEmail: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Client Address</Label>
            <Input value={invoice.clientAddress} onChange={(e) => setInvoice({ ...invoice, clientAddress: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Input type="date" value={invoice.issueDate} onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={invoice.dueDate} onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={invoice.currency} onChange={(e) => setInvoice({ ...invoice, currency: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Tax %</Label>
            <Input type="number" value={invoice.taxRate} onChange={(e) => setInvoice({ ...invoice, taxRate: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-12">
                <Input className="md:col-span-6" placeholder="Description" value={it.description} onChange={(e) => setRow(idx,'description', e.target.value)} />
                <Input className="md:col-span-2" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => setRow(idx,'quantity', Number(e.target.value))} />
                <Input className="md:col-span-2" type="number" placeholder="Unit Price" value={it.unitPrice} onChange={(e) => setRow(idx,'unitPrice', Number(e.target.value))} />
                <div className="md:col-span-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{(it.quantity * it.unitPrice).toFixed(2)}</span>
                  <Button variant="outline" size="sm" onClick={() => removeRow(idx)}>Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addRow}>Add Item</Button>
          </div>
          <div className="mt-4 grid gap-1 text-right">
            <div>Subtotal: {subtotal.toFixed(2)} {invoice.currency}</div>
            <div>Tax: {(taxAmount).toFixed(2)} {invoice.currency}</div>
            <div className="text-lg font-semibold">Total: {total.toFixed(2)} {invoice.currency}</div>
          </div>
          {error && <div className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


