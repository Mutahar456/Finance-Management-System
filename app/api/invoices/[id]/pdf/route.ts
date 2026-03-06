import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jsPDF from "jspdf"

async function fetchAsDataUrl(url: string) {
  try {
    const res = await fetch(url)
    const buf = Buffer.from(await res.arrayBuffer())
    const base64 = buf.toString('base64')
    const ext = url.toLowerCase().endsWith('.png') ? 'png' : 'jpeg'
    return `data:image/${ext};base64,${base64}`
  } catch {
    return undefined
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true, project: true } })
  if (!invoice) return new NextResponse('Not found', { status: 404 })

  const doc = new jsPDF({ unit: 'pt' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 40

  const brand = {
    navy: { r: 11, g: 19, b: 43 }, // #0b132b
    orange: { r: 249, g: 115, b: 22 }, // #f97316
    gray: { r: 240, g: 242, b: 245 },
  }

  const currencyRaw = String(invoice.currency || 'PKR').toUpperCase()
  const currency = currencyRaw.replace(/[^A-Z]/g, '').slice(0, 3) || 'PKR'
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency })
  const money = (n: any) => fmt.format(Number(n || 0))

  // Branding
  const company = {
    name: 'Infinity Wave Inc',
    address: 'Uet Housing Society Lahore Near NFC',
    phone: '03222988645',
    email: 'contact@infinitywaveinc.com',
    whatsapp: '+61 425221846',
    website: 'www.infinitywaveinc.com',
  }

  const logoUrl = process.env.LOGO_URL
  if (logoUrl) {
    const dataUrl = await fetchAsDataUrl(logoUrl)
    if (dataUrl) {
      doc.addImage(dataUrl, 'PNG', 40, y, 60, 60)
    }
  }

  // Company block
  doc.setFontSize(18)
  doc.setTextColor(brand.navy.r, brand.navy.g, brand.navy.b)
  doc.text(company.name, 110, y + 18)
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(company.address, 110, y + 34)
  doc.text(`Phone: ${company.phone}`, 110, y + 48)
  doc.text(`Email: ${company.email}`, 110, y + 62)

  // Invoice panel (right)
  doc.setFontSize(24)
  doc.setTextColor(brand.navy.r, brand.navy.g, brand.navy.b)
  doc.text(`INVOICE`, pageWidth - 40, y + 10, { align: 'right' })
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 40, y + 28, { align: 'right' })
  doc.text(`Issue: ${new Date(invoice.issueDate as any).toLocaleDateString()}`, pageWidth - 40, y + 42, { align: 'right' })
  doc.text(`Due: ${invoice.dueDate ? new Date(invoice.dueDate as any).toLocaleDateString() : '-'}`, pageWidth - 40, y + 56, { align: 'right' })
  y += 90

  // Bill to
  doc.setFontSize(12)
  doc.text('Bill To:', 40, y)
  doc.setFontSize(11)
  doc.text(invoice.clientName || '-', 40, y + 16)
  if (invoice.clientEmail) doc.text(invoice.clientEmail, 40, y + 32)
  if (invoice.clientAddress) doc.text(doc.splitTextToSize(invoice.clientAddress, pageWidth - 80), 40, y + 48)
  y += 80

  // Items table header
  const headers = ['Description', 'Qty', 'Unit Price', 'Line Total']
  const colX = [40, pageWidth - 260, pageWidth - 160, pageWidth - 60]
  doc.setFillColor(brand.navy.r, brand.navy.g, brand.navy.b)
  doc.rect(40, y, pageWidth - 80, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  headers.forEach((h, i) => doc.text(h, colX[i], y + 16))
  y += 30
  doc.setTextColor(0, 0, 0)

  // Rows
  doc.setFontSize(11)
  invoice.items.forEach((it, idx) => {
    // Zebra row background
    if (idx % 2 === 0) {
      doc.setFillColor(brand.gray.r, brand.gray.g, brand.gray.b)
      doc.rect(40, y - 8, pageWidth - 80, 24, 'F')
    }
    const desc = doc.splitTextToSize(it.description, colX[1] - 60)
    doc.setTextColor(0, 0, 0)
    doc.text(desc as any, 46, y + 4)
    doc.text(String(it.quantity), colX[1], y + 4)
    doc.text(money(it.unitPrice), colX[2], y + 4)
    doc.text(money(it.lineTotal), colX[3], y + 4, { align: 'right' })
    y += 24 + (Array.isArray(desc) ? (desc.length - 1) * 12 : 0)
  })

  y += 10
  doc.line(40, y, pageWidth - 40, y)
  y += 20

  // Totals
  const totalsX = pageWidth - 200
  doc.text('Subtotal:', totalsX, y)
  doc.text(money(invoice.subtotal), pageWidth - 40, y, { align: 'right' })
  y += 16
  doc.text('Tax:', totalsX, y)
  doc.text(money(invoice.taxAmount), pageWidth - 40, y, { align: 'right' })
  y += 16
  doc.setFontSize(12)
  doc.text('Total:', totalsX, y)
  doc.text(money(invoice.total), pageWidth - 40, y, { align: 'right' })
  y += 30

  if (invoice.notes) {
    doc.setFontSize(11)
    doc.text('Notes:', 40, y)
    y += 14
    doc.text(doc.splitTextToSize(invoice.notes, pageWidth - 80) as any, 40, y)
    y += 30
  }

  if (invoice.terms) {
    doc.setFontSize(11)
    doc.text('Terms:', 40, y)
    y += 14
    doc.text(doc.splitTextToSize(invoice.terms, pageWidth - 80) as any, 40, y)
  }

  // Footer
  const footerY = pageHeight - 40
  doc.setDrawColor(220)
  doc.line(40, footerY - 12, pageWidth - 40, footerY - 12)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`${company.website}  •  ${company.email}  •  WhatsApp ${company.whatsapp}`, pageWidth / 2, footerY, { align: 'center' })

  const pdfBytes = doc.output('arraybuffer') as ArrayBuffer
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=${invoice.invoiceNumber}.pdf`,
    },
  })
}


