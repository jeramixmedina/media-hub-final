function escapePdfText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?')
}

function toBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function buildSimpleTextPdfBase64(lines) {
  const safeLines = lines.slice(0, 80).map(escapePdfText)
  const content = [
    'BT',
    '/F1 10 Tf',
    '36 806 Td',
    ...safeLines.map((line, index) => `${index === 0 ? '' : 'T* ' }(${line}) Tj`.trim()),
    'ET',
  ].join('\n')
<<<<<<< HEAD
  const contentLength = byteLength(content)
=======
>>>>>>> main

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
<<<<<<< HEAD
    `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${content}\nendstream\nendobj\n`,
=======
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
>>>>>>> main
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
<<<<<<< HEAD
    offsets.push(byteLength(pdf))
    pdf += object
  }

  const xrefStart = byteLength(pdf)
=======
    offsets.push(pdf.length)
    pdf += object
  }

  const xrefStart = pdf.length
>>>>>>> main
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
<<<<<<< HEAD
  const bytes = encoder.encode(pdf)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
=======
  return toBase64(new TextEncoder().encode(pdf))
>>>>>>> main
}
