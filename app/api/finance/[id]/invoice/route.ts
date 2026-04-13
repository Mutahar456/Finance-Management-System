import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jsPDF from "jspdf"
import { getCategoryLabel } from "@/lib/finance-categories"
import {
  drawSalarySlipOnPdf,
  tryLoadLetterheadPngDataUrl,
} from "@/lib/finance-salary-slip-pdf"

async function fetchAsDataUrl(url: string) {
  try {
    const res = await fetch(url)
    const buf = Buffer.from(await res.arrayBuffer())
    const base64 = buf.toString("base64")
    const ext = url.toLowerCase().endsWith(".png") ? "png" : "jpeg"
    return `data:image/${ext};base64,${base64}`
  } catch {
    return undefined
  }
}

function companyBlock() {
  return {
    name: process.env.COMPANY_NAME || "Infinity Wave Inc",
    address:
      process.env.COMPANY_ADDRESS || "Uet Housing Society Lahore Near NFC",
    phone: process.env.COMPANY_PHONE || "03222988645",
    email: process.env.COMPANY_EMAIL || "contact@infinitywaveinc.com",
    website: process.env.COMPANY_WEBSITE || "www.infinitywaveinc.com",
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const transaction = await prisma.financeTransaction.findUnique({
    where: { id: params.id },
  })

  if (!transaction) {
    return new NextResponse("Not found", { status: 404 })
  }

  const role = session.user?.role
  const userId = session.user?.id
  if (role !== "ADMIN" && transaction.userId !== userId) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  if (transaction.type === "EXPENSE" && transaction.category === "salaries") {
    const letterhead = await tryLoadLetterheadPngDataUrl()
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    const userName = session.user?.name || "User"
    drawSalarySlipOnPdf(doc, transaction, letterhead, userName)
    const safeEmp = (
      (transaction as { salaryEmployeeName?: string | null }).salaryEmployeeName?.trim() ||
      transaction.title
    )
      .replace(/[^\w\s-]/g, "")
      .slice(0, 40)
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "salary-slip"
    const pdfBytes = doc.output("arraybuffer") as ArrayBuffer
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="salary-slip-${safeEmp}-${transaction.id.slice(-6)}.pdf"`,
      },
    })
  }

  const company = companyBlock()
  const doc = new jsPDF({ unit: "pt" })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 40

  const logoUrl = process.env.LOGO_URL
  let logoWidth = 0
  if (logoUrl) {
    const dataUrl = await fetchAsDataUrl(logoUrl)
    if (dataUrl) {
      const fmt = dataUrl.includes("image/png") ? "PNG" : "JPEG"
      doc.addImage(dataUrl, fmt, 40, y, 60, 60)
      logoWidth = 70
    }
  }

  const companyX = 40 + logoWidth
  doc.setFontSize(18)
  doc.text(company.name, companyX, y + 18)
  doc.setFontSize(10)
  doc.text(company.address, companyX, y + 34)
  doc.text(`Phone: ${company.phone}  •  Email: ${company.email}`, companyX, y + 48)
  y += 56

  doc.setFontSize(20)
  doc.text("Transaction invoice", pageWidth - 40, y, { align: "right" })
  doc.setFontSize(10)
  const invNo = `INV-${transaction.id.slice(-10).toUpperCase()}`
  doc.text(`Invoice #: ${invNo}`, pageWidth - 40, y + 18, { align: "right" })
  y += 36

  doc.setDrawColor(200, 200, 200)
  doc.line(40, y, pageWidth - 40, y)
  y += 24

  const amt = Number(transaction.amount)
  const categoryLabel = transaction.category
    ? getCategoryLabel(transaction.category)
    : "—"
  const txDate = new Date(transaction.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const labelX = 40
  const valueX = 150
  const valueWidth = pageWidth - valueX - 40

  const drawRow = (label: string, value: string) => {
    const startY = y
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(label, labelX, startY)
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(value, valueWidth)
    doc.text(lines, valueX, startY)
    const lineCount = Array.isArray(lines) ? lines.length : 1
    y = startY + lineCount * 14 + 12
  }

  drawRow("Title", transaction.title)
  drawRow("Type", transaction.type)
  drawRow("Category", categoryLabel)
  drawRow("Transaction date", txDate)
  drawRow(
    "Amount",
    `${transaction.type === "INCOME" ? "+" : "-"} Rs ${amt.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  )
  if (transaction.description?.trim()) {
    drawRow("Description", transaction.description.trim())
  }

  y += 8
  doc.setFillColor(255, 247, 237)
  doc.rect(40, y, pageWidth - 80, 56, "F")
  doc.setFontSize(10)
  doc.setTextColor(120, 53, 15)
  doc.text(
    "This PDF is generated from your ledger when no external receipt was uploaded. It serves as an internal record only.",
    48,
    y + 18,
    { maxWidth: pageWidth - 100 }
  )
  doc.setTextColor(0, 0, 0)

  y += 72
  doc.line(40, y, pageWidth - 40, y)
  y += 20

  const userName = session.user?.name || "User"
  const generatedDate = new Date()
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated by: ${userName}`, 40, y)
  doc.text(
    `Generated on: ${generatedDate.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    })}`,
    40,
    y + 14
  )

  const safeName = transaction.title
    .replace(/[^\w\s-]/g, "")
    .slice(0, 40)
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "transaction"

  const pdfBytes = doc.output("arraybuffer") as ArrayBuffer
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${safeName}-${transaction.id.slice(-6)}.pdf"`,
    },
  })
}
