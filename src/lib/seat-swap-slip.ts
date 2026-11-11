export type DigitalSlipData = {
  offerId?: string;
  trainNumber: string;
  trainName?: string;
  fromStation?: string;
  toStation?: string;
  journeyDate?: string;
  acceptedAt?: string;
  expiresAt?: string;
  reason?: string;
  passenger1Name: string;
  passenger1From: string;
  passenger1To: string;
  passenger2Name: string;
  passenger2From: string;
  passenger2To: string;
};

const ascii = (value: string) => value
  .replace(/[→➔↔]/g, '->')
  .replace(/[–—]/g, '-')
  .replace(/[^\x20-\x7E]/g, '-')
  .replace(/[()\\]/g, '\\$&');

const dateTime = (value?: string) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  }).format(date) + ' IST';
};

function text(x: number, y: number, size: number, value: string, color = '0.86 0.91 0.98') {
  return `BT /F1 ${size} Tf ${color} rg ${x} ${y} Td (${ascii(value)}) Tj ET`;
}

function roundedRect(x: number, y: number, width: number, height: number, fill: string, stroke?: string) {
  const commands = [`${fill} rg`, `${x} ${y} ${width} ${height} re f`];
  if (stroke) commands.push(`${stroke} RG`, `${x} ${y} ${width} ${height} re S`);
  return commands.join('\n');
}

export function buildDigitalSlipPdf(data: DigitalSlipData) {
  const content = [
    '0.035 0.055 0.10 rg 0 0 612 792 re f',
    roundedRect(34, 34, 544, 724, '0.055 0.085 0.15', '0.15 0.24 0.38'),
    roundedRect(34, 654, 544, 104, '0.035 0.075 0.16'),
    text(58, 722, 10, 'RAIL EXPLORER  /  PASSENGER TOOLS', '0.34 0.68 1.00'),
    text(58, 688, 22, 'Mutual berth exchange', '1 1 1'),
    text(58, 668, 9, 'DIGITAL CONSENT RECORD  -  NOT A RAILWAY TICKET', '0.44 0.91 0.75'),
    text(58, 623, 9, `RECORD ID  ${data.offerId || `RE-${data.trainNumber}-${Date.now().toString(36).toUpperCase()}`}`, '0.55 0.65 0.78'),
    text(58, 597, 10, 'JOURNEY', '0.40 0.70 1.00'),
    text(58, 574, 15, `${data.trainNumber}  ${data.trainName || 'Train'}`, '1 1 1'),
    text(58, 551, 10, `Route: ${data.fromStation || 'Not provided'} -> ${data.toStation || 'Not provided'}`),
    text(58, 531, 10, `Journey date: ${data.journeyDate || 'Not provided'}`),
    text(58, 511, 10, `Accepted: ${dateTime(data.acceptedAt)}`),
    text(58, 491, 10, `Listing expires: ${dateTime(data.expiresAt)}`),
    '0.15 0.24 0.38 RG 58 472 m 554 472 l S',
    text(58, 449, 9, 'MUTUAL EXCHANGE', '0.40 0.70 1.00'),
    roundedRect(52, 338, 508, 92, '0.035 0.065 0.13', '0.14 0.23 0.38'),
    text(70, 403, 11, data.passenger1Name, '1 1 1'),
    text(70, 381, 10, `From  ${data.passenger1From}`, '0.70 0.77 0.88'),
    text(70, 360, 10, `To       ${data.passenger1To}`, '0.44 0.91 0.75'),
    roundedRect(52, 232, 508, 92, '0.035 0.065 0.13', '0.14 0.23 0.38'),
    text(70, 297, 11, data.passenger2Name, '1 1 1'),
    text(70, 275, 10, `From  ${data.passenger2From}`, '0.70 0.77 0.88'),
    text(70, 254, 10, `To       ${data.passenger2To}`, '0.44 0.91 0.75'),
    text(58, 209, 9, `Reason: ${data.reason || 'Mutual voluntary exchange'}`, '0.70 0.77 0.88'),
    '0.15 0.24 0.38 RG 58 190 m 554 190 l S',
    text(58, 168, 10, 'PLEASE CONFIRM WITH THE ONBOARD TTE', '1 0.78 0.26'),
    text(58, 148, 9, 'This record documents the passengers\' mutual consent only.', '0.70 0.77 0.88'),
    text(58, 132, 9, 'It does not change the official reservation or guarantee a berth.', '0.70 0.77 0.88'),
    text(58, 116, 9, 'Follow railway rules. No money should be exchanged for a berth swap.', '0.70 0.77 0.88'),
    text(58, 72, 8, `Generated ${dateTime(new Date().toISOString())}  |  rail-explorer.vercel.app`, '0.40 0.50 0.64'),
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  return pdf + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
}
