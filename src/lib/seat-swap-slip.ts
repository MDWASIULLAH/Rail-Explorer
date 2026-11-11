export type DigitalSlipData = {
  trainNumber: string;
  trainName?: string;
  journeyDate?: string;
  acceptedAt?: string;
  passenger1Name: string;
  passenger1From: string;
  passenger1To: string;
  passenger2Name: string;
  passenger2From: string;
  passenger2To: string;
};

function escapePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '-').replace(/[()\\]/g, '\\$&');
}

export function buildDigitalSlipPdf(data: DigitalSlipData) {
  const lines = [
    'RAIL EXPLORER - DIGITAL BERTH EXCHANGE SUMMARY',
    'Not a railway ticket or official railway authorization.',
    '',
    `Train: ${data.trainNumber} - ${data.trainName || 'Train'}`,
    `Journey date: ${data.journeyDate || 'Not provided'}`,
    `Accepted: ${data.acceptedAt ? new Date(data.acceptedAt).toLocaleString('en-IN') : 'Confirmed in Rail Explorer'}`,
    '',
    `${data.passenger1Name}: ${data.passenger1From} -> ${data.passenger1To}`,
    `${data.passenger2Name}: ${data.passenger2From} -> ${data.passenger2To}`,
    '',
    'Both passengers should follow railway rules and confirm any berth exchange',
    'with the onboard TTE. This record only documents mutual consent.',
  ].map(escapePdfText);
  const content = [
    'BT',
    '/F1 16 Tf',
    '50 790 Td',
    `(${lines[0]}) Tj`,
    '/F1 10 Tf',
    ...lines.slice(1).map((line) => `0 -25 Td (${line}) Tj`),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
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
