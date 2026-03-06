"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10))
  const [dueDate, setDueDate] = useState("")
  const [currency, setCurrency] = useState("PKR")
  const [taxRate, setTaxRate] = useState("0")
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const addRow = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  const removeRow = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const setRow = (i: number, key: string, value: any) => setItems(items.map((r, idx) => idx === i ? { ...r, [key]: value } : r))

  const submit = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${params.id}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, clientEmail, clientAddress, issueDate, dueDate, currency, taxRate: Number(taxRate), items })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/projects/${params.id}/invoices`)
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const taxAmount = (subtotal * Number(taxRate || 0)) / 100
  const total = subtotal + taxAmount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Invoice</h1>
        <p className="text-muted-foreground">Create an invoice for this project</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Client Email</Label>
            <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Client Address</Label>
            <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tax %</Label>
            <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
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
            <div>Subtotal: {subtotal.toFixed(2)} {currency}</div>
            <div>Tax: {taxAmount.toFixed(2)} {currency}</div>
            <div className="text-lg font-semibold">Total: {total.toFixed(2)} {currency}</div>
          </div>
          {error && <div className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
          <div className="mt-4 flex gap-2">
            <Button onClick={submit} disabled={loading}>{loading ? 'Saving...' : 'Create Invoice'}</Button>
            <Button variant="outline" onClick={() => history.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


