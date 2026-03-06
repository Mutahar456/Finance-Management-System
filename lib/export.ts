import jsPDF from 'jspdf'

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(','))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    })
    csvRows.push(values.join(','))
  }

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

export function exportToPDF(title: string, data: any[], columns: string[], filename: string) {
  const doc = new jsPDF()
  
  // Add company header
  doc.setFontSize(18)
  doc.text('Infinity Wave Inc', 14, 20)
  doc.setFontSize(14)
  doc.text(title, 14, 30)
  
  // Add table
  const startY = 40
  const pageHeight = doc.internal.pageSize.height
  let y = startY
  
  // Table headers
  doc.setFontSize(10)
  // Some environments/type defs require a font name; fallback to default
  try { doc.setFont('helvetica', 'bold') } catch { /* ignore */ }
  let x = 14
  columns.forEach((col, idx) => {
    doc.text(col, x, y)
    x += 40
  })
  
  y += 10
  try { doc.setFont('helvetica', 'normal') } catch { /* ignore */ }
  
  // Table data
  data.forEach((row, rowIdx) => {
    if (y > pageHeight - 20) {
      doc.addPage()
      y = 20
    }
    
    x = 14
    columns.forEach((col) => {
      const value = row[col]?.toString() ?? ''
      doc.text(value.substring(0, 15), x, y)
      x += 40
    })
    y += 10
  })
  
  doc.save(`${filename}.pdf`)
}


