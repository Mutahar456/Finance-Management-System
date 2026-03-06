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

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  let from = searchParams.get('from')
  let to = searchParams.get('to')

  // Base where clause for user filtering
  const baseWhere: any = {}
  if (session.user?.role !== 'ADMIN') baseWhere.userId = session.user!.id

  // If range not provided, auto-detect from all transactions
  if (!from && !to) {
    const allTxs = await prisma.financeTransaction.findMany({ 
      where: baseWhere, 
      orderBy: { date: 'asc' },
      select: { date: true }
    })
    
    if (allTxs.length > 0) {
      // Auto-detect range: first transaction to last transaction
      from = new Date(allTxs[0].date).toISOString().split('T')[0]
      to = new Date(allTxs[allTxs.length - 1].date).toISOString().split('T')[0]
    }
  }

  // Build where clause with date range
  const where: any = { ...baseWhere }
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  const txs = await prisma.financeTransaction.findMany({ where, orderBy: { date: 'asc' } })

  // Calculate starting balance (balance before the date range)
  const beforeWhere: any = {}
  if (session.user?.role !== 'ADMIN') beforeWhere.userId = session.user!.id
  if (from) {
    beforeWhere.date = { lt: new Date(from) }
  } else if (txs.length > 0) {
    // If no from date, get balance before first transaction
    const firstTxDate = new Date(txs[0].date)
    beforeWhere.date = { lt: firstTxDate }
  } else {
    beforeWhere.date = { lt: new Date() } // If no transactions, starting balance is 0
  }
  
  const beforeTxs = await prisma.financeTransaction.findMany({ 
    where: beforeWhere, 
    orderBy: { date: 'asc' } 
  })
  
  let startingBalance = 0
  beforeTxs.forEach((t) => {
    const amt = Number(t.amount)
    if ((t.type as any) === 'INCOME') {
      startingBalance += amt
    } else {
      startingBalance -= amt
    }
  })

  const doc = new jsPDF({ unit: 'pt' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 40

  const company = {
    name: 'Infinity Wave Inc',
    address: 'Uet Housing Society Lahore Near NFC',
    phone: '03222988645',
    email: 'contact@infinitywaveinc.com',
    website: 'www.infinitywaveinc.com',
  }

  // Add company logo if available
  const logoUrl = process.env.LOGO_URL
  let logoWidth = 0
  if (logoUrl) {
    const dataUrl = await fetchAsDataUrl(logoUrl)
    if (dataUrl) {
      doc.addImage(dataUrl, 'PNG', 40, y, 60, 60)
      logoWidth = 70 // Space for logo + gap
    }
  }

  // Company information (adjusted if logo is present)
  const companyX = 40 + logoWidth
  doc.setFontSize(18)
  doc.text(company.name, companyX, y + 18)
  doc.setFontSize(10)
  doc.text(company.address, companyX, y + 34)
  doc.text(`Phone: ${company.phone}  •  Email: ${company.email}`, companyX, y + 48)
  y += 50

  doc.setFontSize(20)
  doc.text('Finance Statement', pageWidth - 40, y, { align: 'right' })
  doc.setFontSize(10)
  
  // Format date range for display
  let rangeText = 'All Transactions'
  if (from || to) {
    const fromDate = from ? new Date(from).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    const toDate = to ? new Date(to).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    rangeText = `${fromDate} to ${toDate}`
  } else if (txs.length > 0) {
    // If no range provided but we have transactions, show the detected range
    const firstDate = new Date(txs[0].date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    const lastDate = new Date(txs[txs.length - 1].date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    rangeText = `${firstDate} to ${lastDate}`
  }
  
  doc.text(`Range: ${rangeText}`, pageWidth - 40, y + 16, { align: 'right' })
  y += 30

  // Table header with proper column spacing to prevent overlap
  const headers = ['Date', 'Title', 'Type', 'Amount', 'Balance']
  // Column positions with proper spacing: Date, Title, Type, Amount, Balance
  const colX = [40, 100, 250, 330, 420]
  const colWidths = [60, 140, 70, 80, 75] // Widths for each column
  
  doc.setFillColor(11, 19, 43)
  doc.rect(40, y, pageWidth - 80, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  headers.forEach((h, i) => {
    if (i === headers.length - 1 || i === headers.length - 2) {
      // Right align Amount and Balance
      doc.text(h, colX[i] + colWidths[i], y + 16, { align: 'right' })
    } else {
      doc.text(h, colX[i], y + 16)
    }
  })
  y += 30
  doc.setTextColor(0, 0, 0)

  let balance = startingBalance // Start with the starting balance
  let totalIncome = 0
  let totalExpense = 0

  txs.forEach((t, idx) => {
    // Check if we need a new page (use pageHeight, not pageWidth)
    if (y > pageHeight - 100) {
      doc.addPage()
      y = 40
      // Redraw header on new page
      doc.setFillColor(11, 19, 43)
      doc.rect(40, y, pageWidth - 80, 24, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      headers.forEach((h, i) => {
        if (i === headers.length - 1 || i === headers.length - 2) {
          doc.text(h, colX[i] + colWidths[i], y + 16, { align: 'right' })
        } else {
          doc.text(h, colX[i], y + 16)
        }
      })
      y += 30
      doc.setTextColor(0, 0, 0)
    }

    const amt = Number(t.amount)
    if ((t.type as any) === 'INCOME') { 
      balance += amt
      totalIncome += amt 
    } else { 
      balance -= amt
      totalExpense += amt 
    }
    
    // Calculate title wrapping first to determine row height
    const titleMaxWidth = colWidths[1] - 5 // Use column width minus padding
    const title = doc.splitTextToSize(t.title, titleMaxWidth)
    const titleLines = Array.isArray(title) ? title.length : 1
    const rowHeight = Math.max(20, 16 + (titleLines - 1) * 12)
    
    // Zebra striping (adjust height based on content)
    if (idx % 2 === 0) {
      doc.setFillColor(240, 242, 245)
      doc.rect(40, y - 10, pageWidth - 80, rowHeight + 4, 'F')
    }
    
    // Date column
    doc.setFontSize(10)
    doc.text(new Date(t.date as any).toLocaleDateString(), colX[0], y)
    
    // Title column (with strict width constraint to prevent overlap)
    // Draw title with max width constraint - each line separately
    if (Array.isArray(title)) {
      title.forEach((line, lineIdx) => {
        doc.text(line, colX[1], y + (lineIdx * 12))
      })
    } else {
      doc.text(title, colX[1], y)
    }
    
    // Type column (positioned after Title with gap - always on first line)
    doc.text(String(t.type), colX[2], y)
    
    // Amount column (right-aligned with Rs - always on first line)
    const amountText = (t.type as any) === 'INCOME' 
      ? `Rs ${amt.toFixed(2)}` 
      : `Rs -${amt.toFixed(2)}`
    doc.text(amountText, colX[3] + colWidths[3], y, { align: 'right' })
    
    // Balance column (right-aligned with Rs - always on first line)
    doc.text(`Rs ${balance.toFixed(2)}`, colX[4] + colWidths[4], y, { align: 'right' })
    
    // Adjust y position based on title wrapping
    y += rowHeight
  })

  y += 10
  doc.line(40, y, pageWidth - 40, y)
  y += 24
  
  // Summary section with Starting Balance, Totals, and Closing Balance
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Starting Balance:', 40, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`Rs ${startingBalance.toFixed(2)}`, pageWidth - 40, y, { align: 'right' })
  y += 18
  
  doc.text('Total Income:', 40, y)
  doc.text(`Rs ${totalIncome.toFixed(2)}`, pageWidth - 40, y, { align: 'right' })
  y += 18
  
  doc.text('Total Expense:', 40, y)
  doc.text(`Rs ${totalExpense.toFixed(2)}`, pageWidth - 40, y, { align: 'right' })
  y += 18
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Net Change:', 40, y)
  doc.text(`Rs ${(totalIncome - totalExpense).toFixed(2)}`, pageWidth - 40, y, { align: 'right' })
  y += 20
  
  doc.line(40, y, pageWidth - 40, y)
  y += 20
  
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Closing Balance:', 40, y)
  doc.text(`Rs ${balance.toFixed(2)}`, pageWidth - 40, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  
  // Footer with Generated By and Date/Time
  y += 30
  doc.line(40, y, pageWidth - 40, y)
  y += 20
  
  // Get user name and current date/time
  const userName = session.user?.name || 'Unknown User'
  const generatedDate = new Date()
  const dateStr = generatedDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const timeStr = generatedDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
  
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated By: ${userName}`, 40, y)
  doc.text(`Generated On: ${dateStr} at ${timeStr}`, 40, y + 12)
  
  // Page number if multiple pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 20, { align: 'right' })
  }

  const pdfBytes = doc.output('arraybuffer') as ArrayBuffer
  return new NextResponse(Buffer.from(pdfBytes), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename=statement.pdf' } })
}


